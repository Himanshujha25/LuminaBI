const fs = require('fs');
const csv = require('csv-parser');
const pool = require('../db/db');

// Detect basic column types
const detectType = (value) => {
    if (!value || value.trim() === '') return 'TEXT';
    value = value.trim();
    if (!isNaN(value) && !isNaN(parseFloat(value))) {
        if (value.includes('.')) return 'DOUBLE PRECISION';
        return 'INTEGER';
    }
    if (!isNaN(Date.parse(value)) && /[-/]/.test(value)) {
        return 'TIMESTAMP';
    }
    return 'TEXT';
};

// Replace spaces/special chars for postgres
const sanitizeIdentifier = (name) => {
    let clean = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (/^[0-9]/.test(clean)) {
        clean = 'c_' + clean;
    }
    return clean || 'col';
};

// Batch Insert Function
async function insertBatch(tableName, headers, colMap, rows) {
    if(rows.length === 0) return;

    // Construct parameterized multi-row insert for safety and speed
    const columns = headers.map(h => `"${colMap[h]}"`).join(', ');
    
    let valuesArr = [];
    let paramIndex = 1;
    let valuePlaceholders = [];
    
    for (let row of rows) {
        let rowPlaceholders = [];
        for (let h of headers) {
             let val = row[h];
             if (val === null || val === undefined || val.trim() === '') {
                  valuesArr.push(null);
             } else {
                  valuesArr.push(val);
             }
             rowPlaceholders.push(`$${paramIndex}`);
             paramIndex++;
        }
        valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
    }
    
    const query = `INSERT INTO ${tableName} (${columns}) VALUES ${valuePlaceholders.join(', ')}`;
    await pool.query(query, valuesArr);
}

const uploadCSV = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { tablename } = req.body; 
    if (!tablename) {
        return res.status(400).json({ error: 'Please provide a tablename form field.' });
    }

    const dbTableName = 'dt_' + Date.now() + '_' + sanitizeIdentifier(tablename);
    
    let isTableCreated = false;
    let headers = [];
    let colMap = {};
    let metadataColumns = [];
    let batch = [];
    const BATCH_SIZE = 500; // Optimal batch size for PostgreSQL params limits (max 65535)
    let totalRows = 0;

    // Process the stream as a Promise so we manage stream operations
    const processCSV = new Promise((resolve, reject) => {
        const stream = fs.createReadStream(req.file.path).pipe(csv());

        stream.on('headers', (streamHeaders) => {
             headers = streamHeaders.map(h => h.trim()).filter(h => h.length > 0);
             if (headers.length === 0) {
                 reject(new Error('No headers found in CSV.'));
             }
        });

        stream.on('data', async (data) => {
            batch.push(data);
            totalRows++;
            
            // On first row we detect types and create table dynamically
            if (!isTableCreated && batch.length === 1) {
                stream.pause();
                try {
                    const colDefs = [];
                    headers.forEach((header) => {
                        let colName = sanitizeIdentifier(header);
                        let count = 1;
                        while(Object.values(colMap).includes(colName)) {
                            colName = colName + '_' + count;
                            count++;
                        }
                        colMap[header] = colName;
                        
                        const rawVal = batch[0][header];
                        const type = detectType(rawVal);
                        
                        colDefs.push(`"${colName}" ${type}`);
                        metadataColumns.push({ original: header, name: colName, type });
                    });
                    
                    const createTableQuery = `CREATE TABLE ${dbTableName} (${colDefs.join(', ')})`;
                    await pool.query(createTableQuery);
                    isTableCreated = true;
                    stream.resume();
                } catch(err) {
                    reject(err);
                }
            }

            // Once batch size is reached, pause stream, write to DB, empty batch, resume
            if (batch.length >= BATCH_SIZE) {
                stream.pause();
                const currentBatch = [...batch];
                batch = []; // Clear array specifically here
                
                insertBatch(dbTableName, headers, colMap, currentBatch)
                    .then(() => stream.resume())
                    .catch(err => reject(err));
            }
        });

        stream.on('end', async () => {
             try {
                // If there's any remaining data in the final batch, process it
                if (batch.length > 0) {
                    await insertBatch(dbTableName, headers, colMap, batch);
                }
                resolve();
             } catch(err) {
                 reject(err);
             }
        });
        
        stream.on('error', (err) => reject(err));
    });

    try {
        await processCSV;
        
        // Clean up multer temp storage
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        const insertMetadata = `
            INSERT INTO datasets (name, table_name, columns)
            VALUES ($1, $2, $3) RETURNING id, name, table_name
        `;
        const metaResult = await pool.query(insertMetadata, [tablename, dbTableName, JSON.stringify(metadataColumns)]);

        return res.json({ 
            message: `Successfully processed ${totalRows} rows. Data ready for analysis!`, 
            dataset: metaResult.rows[0]
        });
    } catch(err) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error("Error saving dataset:", err);
        return res.status(500).json({ error: 'Failed to process dataset: ' + err.message });
    }
};

const getDatasets = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, table_name, created_at FROM datasets ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

const deleteDataset = async (req, res) => {
    const { id } = req.params;
    try {
        // Find the table name to drop it
        const metaResult = await pool.query('SELECT table_name FROM datasets WHERE id = $1', [id]);
        if (metaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Dataset not found' });
        }
        
        const tableName = metaResult.rows[0].table_name;

        // Drop the actual data table
        await pool.query(`DROP TABLE IF EXISTS "${tableName}"`);
        
        // Remove from metadata tracking
        await pool.query('DELETE FROM datasets WHERE id = $1', [id]);

        return res.json({ message: 'Dataset permanently deleted and dropped from db.' });
    } catch (err) {
        console.error('Delete error', err);
        return res.status(500).json({ error: 'Failed to delete dataset: ' + err.message });
    }
}

module.exports = { uploadCSV, getDatasets, deleteDataset };
