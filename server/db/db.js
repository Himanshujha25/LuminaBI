require("dotenv").config();
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in server/.env");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20, // Increased pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
});

const dbState = {
  ready: false,
  lastError: null,
};

pool.on("error", (error) => {
  dbState.ready = false;
  dbState.lastError = error;
  console.error("[db] Unexpected pool error:", error.message || error);
});

pool.verifyConnection = async () => {
  try {
    await pool.query("SELECT 1");
    dbState.ready = true;
    dbState.lastError = null;
    return true;
  } catch (error) {
    dbState.ready = false;
    dbState.lastError = error;
    throw error;
  }
};

pool.dbState = dbState;

module.exports = pool;
