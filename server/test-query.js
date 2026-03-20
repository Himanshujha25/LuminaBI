require('dotenv').config();
const pool = require('./db/db');
async function test() {
  try {
    const res = await pool.query('SELECT * FROM dataset_collaborators');
    console.log('Collaborators:', res.rows);
    const users = await pool.query('SELECT id, email FROM users');
    console.log('Users:', users.rows);
    const datasets = await pool.query('SELECT id, user_id FROM datasets');
    console.log('Datasets:', datasets.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
test();
