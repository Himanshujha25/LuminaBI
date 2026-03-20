require('dotenv').config();
const pool = require('./db/db');
async function checkSize() {
  try {
    const res = await pool.query(`
      SELECT relname as "Table",
             pg_size_pretty(pg_total_relation_size(relid)) As "Size",
             pg_total_relation_size(relid) as bytes
      FROM pg_catalog.pg_statio_user_tables 
      ORDER BY pg_total_relation_size(relid) DESC
      LIMIT 10;
    `);
    console.table(res.rows);
  } catch(e) { console.error(e); }
  process.exit(0);
}
checkSize();
