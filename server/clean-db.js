require('dotenv').config();
const pool = require('./db/db');

async function cleanDB() {
  try {
    // 1. Get all datasets that look like duplicates (115MB table size)
    const tables = [
      'dt_1773940120291_youtube_content_creation',
      'dt_1773941332489_youtube_content_creation__1_',
      'dt_1774001995427_big_upload_probe_retry'
    ];

    for (const table of tables) {
      console.log(`Dropping ${table}...`);
      await pool.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
      await pool.query('DELETE FROM datasets WHERE table_name = $1', [table]);
    }
    
    console.log("Cleanup complete. Freed ~345MB.");
  } catch (err) {
    console.error("Error cleaning:", err);
  } finally {
    process.exit(0);
  }
}

cleanDB();
