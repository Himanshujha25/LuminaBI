require('dotenv').config();
const pool = require('./db/db');
async function test() {
  try {
    const datasetId = 7;
    const userId = 1;
    const res = await pool.query(
        `SELECT d.table_name, d.columns, d.user_id AS owner_id, u.ai_keys, u.preferred_provider 
         FROM datasets d 
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
        [datasetId, userId]
    );
    console.log('Query Result:', res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
test();
