require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20, // Increased pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});


module.exports = pool;