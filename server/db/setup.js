const pool = require('./db');

async function setup() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Users table is ready.");
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS datasets (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                table_name VARCHAR(255) UNIQUE NOT NULL,
                columns jsonb NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Metadata table 'datasets' is ready.");
    } catch (err) {
        console.error("Error creating datasets table:", err);
    }
}

module.exports = setup;
