require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // Speed/Safety settings:
  statement_timeout: 30000, // 30 seconds
  query_timeout: 35000,      // 35 seconds
  connectionTimeoutMillis: 5000 // 5 seconds to connect
});

module.exports = pool;