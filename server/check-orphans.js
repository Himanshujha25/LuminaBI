require('dotenv').config();
const pool = require('./db/db');
async function checkOrphans() {
  try {
    const res = await pool.query('SELECT table_name FROM datasets');
    const registered = res.rows.map(r => r.table_name);
    console.log('Registered tables:', registered);
    
    // get all dt_ tables
    const tables = await pool.query(`SELECT relname FROM pg_class WHERE relname LIKE 'dt_%'`);
    const allTables = tables.rows.map(r => r.relname);
    console.log('All dt_ tables:', allTables);
    
    // drop orphans
    for(const t of allTables) {
      if(!registered.includes(t)) {
        console.log('Dropping orphan table:', t);
        await pool.query(`DROP TABLE "${t}"`);
      }
    }
  } catch(e) { console.error(e); }
  process.exit(0);
}
checkOrphans();
