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
        await pool.query(`
            CREATE TABLE IF NOT EXISTS chat_histories (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                dataset_id INTEGER REFERENCES datasets(id) ON DELETE CASCADE,
                role VARCHAR(50) NOT NULL,
                text TEXT,
                data JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Chat histories table is ready.");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS dashboards (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                layout JSONB NOT NULL,
                charts JSONB NOT NULL,
                dataset_id INTEGER REFERENCES datasets(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Dashboards table 'dashboards' is ready.");

        // Speed up lookups
        await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_datasets_user ON datasets(user_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_chat_dataset ON chat_histories(dataset_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_dashboards_user ON dashboards(user_id)');
        console.log("Indices created successfully.");
    } catch (err) {
        console.error("Error creating datasets table:", err);
    }
}

module.exports = setup;
