const fs = require('fs');
const csv = require('csv-parser');
const pool = require('../db/db');
const { from: copyFrom } = require('pg-copy-streams');
const { schemaCache } = require('../utils/cache');
const { pipeline } = require('stream/promises');

// Detect basic column types
const detectType = (value) => {
    if (!value || value.trim() === '') return 'TEXT';
    value = value.trim();
    if (!isNaN(value) && !isNaN(parseFloat(value))) {
        if (value.includes('.')) return 'DOUBLE PRECISION';
        return 'BIGINT';
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


const uploadCSV = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const { tablename } = req.body;
    if (!tablename) {
        return res.status(400).json({ error: 'Please provide a tablename.' });
    }

    const dbTableName = 'dt_' + Date.now() + '_' + sanitizeIdentifier(tablename);
    let columns = [];
    let headers = [];
    let tableCreated = false;

    try {
        // 1. First Pass: Detect structure
        const firstRowPromise = new Promise((resolve, reject) => {
            const stream = fs.createReadStream(req.file.path).pipe(csv());
            stream.on('headers', (h) => { headers = h; });
            stream.on('data', (row) => {
                stream.destroy();
                resolve(row);
            });
            stream.on('error', reject);
        });

        const firstRow = await firstRowPromise;
        if (!firstRow || headers.length === 0) {
            throw new Error('CSV appears to be empty or missing headers');
        }

        const colDefs = [];
        headers.forEach(h => {
             const colName = sanitizeIdentifier(h);
             const type = detectType(firstRow[h]);
             colDefs.push(`"${colName}" ${type}`);
             columns.push({ original: h, name: colName, type });
        });

        // 2. Create Table
        await pool.query(`CREATE TABLE "${dbTableName}" (${colDefs.join(', ')})`);
        tableCreated = true;

        // 3. Second Pass: High-Speed Streaming COPY
        const client = await pool.connect();
        try {
            const ingestStream = client.query(copyFrom(`COPY "${dbTableName}" FROM STDIN WITH (FORMAT csv, HEADER true)`));
            const sourceStream = fs.createReadStream(req.file.path);
            
            await pipeline(sourceStream, ingestStream);
        } finally {
            client.release();
        }

        // 4. Create Indices for Speed
        try {
            for (const col of columns) {
                await pool.query(`CREATE INDEX IF NOT EXISTS "idx_${dbTableName}_${col.name}" ON "${dbTableName}" ("${col.name}")`);
            }
        } catch (idxErr) {
            console.warn("Failed to create indices:", idxErr.message);
        }

        // 5. Cleanup and Metadata
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        const userId = req.user ? req.user.id : null;
        const metaRes = await pool.query(
            'INSERT INTO datasets (name, table_name, columns, user_id) VALUES ($1, $2, $3, $4) RETURNING id',
            [tablename, dbTableName, JSON.stringify(columns), userId]
        );

        // Real-time Notify
        const io = req.app.get('io');
        if (io && userId) {
            io.to(`user_${userId}`).emit('dataset-updated', { type: 'upload', datasetId: metaRes.rows[0].id });
        }

        res.json({ 
            message: "Batch processing complete. Dataset ingested at maximum speed.",
            dataset: { id: metaRes.rows[0].id, name: tablename, table_name: dbTableName }
        });

    } catch (err) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        if (tableCreated) {
            try {
                await pool.query(`DROP TABLE IF EXISTS "${dbTableName}"`);
            } catch (dropErr) {
                console.error("Upload cleanup failed:", dropErr);
            }
        }
        console.error("Batch Upload Error:", err);
        res.status(500).json({ error: "High-speed batch processing failed: " + err.message });
    }
};

const getDatasets = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        let query = 'SELECT id, name, table_name, columns, created_at FROM datasets ORDER BY created_at DESC';
        let params = [];
        
        if (userId) {
            query = 'SELECT id, name, table_name, columns, created_at FROM datasets WHERE user_id = $1 ORDER BY created_at DESC';
            params = [userId];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

const getDatasetPreview = async (req, res) => {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;
    try {
        let metaResult;
        if (userId) {
            metaResult = await pool.query(
                `SELECT d.table_name FROM datasets d 
                 JOIN users u ON u.id = $2
                 WHERE d.id = $1 
                 AND (
                   d.user_id = $2 
                   OR EXISTS (
                     SELECT 1 FROM dataset_collaborators dc 
                     WHERE dc.dataset_id = d.id 
                       AND dc.collaborator_email = u.email 
                       AND dc.status = 'accepted'
                   )
                 )`,
                [id, userId]
            );
        } else {
            metaResult = await pool.query('SELECT table_name FROM datasets WHERE id = $1', [id]);
        }
        if (metaResult.rows.length === 0) return res.status(404).json({ error: 'Dataset not found.' });

        const tableName = metaResult.rows[0].table_name;
        const preview = await pool.query(`SELECT * FROM "${tableName}" LIMIT 10`);
        res.json(preview.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteDataset = async (req, res) => {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;
    
    try {
        let metaQuery = 'SELECT table_name FROM datasets WHERE id = $1';
        let metaParams = [id];
        
        if (userId) {
            metaQuery = 'SELECT table_name FROM datasets WHERE id = $1 AND user_id = $2';
            metaParams = [id, userId];
        }

        const metaResult = await pool.query(metaQuery, metaParams);
        if (metaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Dataset not found or unauthorized' });
        }
        
        const tableName = metaResult.rows[0].table_name;

        await pool.query(`DROP TABLE IF EXISTS "${tableName}"`);
        await pool.query('DELETE FROM datasets WHERE id = $1', [id]);
        schemaCache.del(`schema_${id}`);

        // Real-time Notify
        const io = req.app.get('io');
        if (io) {
            io.to(`dataset_${id}`).emit('dataset-updated', { type: 'delete', datasetId: id });
            if (userId) io.to(`user_${userId}`).emit('dataset-updated', { type: 'delete', datasetId: id });
        }

        return res.json({ message: 'Dataset permanently deleted and dropped from db.' });
    } catch (err) {
        console.error('Delete error', err);
        return res.status(500).json({ error: 'Failed to delete dataset: ' + err.message });
    }
}

module.exports = { uploadCSV, getDatasets, getDatasetPreview, deleteDataset };
