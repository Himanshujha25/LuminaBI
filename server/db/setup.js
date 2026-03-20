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

        // ── Collaboration table ──────────────────────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS dataset_collaborators (
                id          SERIAL PRIMARY KEY,
                dataset_id  INTEGER REFERENCES datasets(id) ON DELETE CASCADE,
                user_id     INTEGER REFERENCES users(id)    ON DELETE CASCADE,
                invited_by  INTEGER REFERENCES users(id),
                role        VARCHAR(20)  NOT NULL DEFAULT 'viewer',
                status      VARCHAR(20)  NOT NULL DEFAULT 'pending',
                invite_token VARCHAR(255) UNIQUE,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (dataset_id, user_id)
            )
        `);
        console.log("Collaborators table 'dataset_collaborators' is ready.");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS exports (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                dashboard_id INTEGER REFERENCES dashboards(id) ON DELETE SET NULL,
                type VARCHAR(50) NOT NULL,
                file_path TEXT NOT NULL,
                name VARCHAR(255),
                metadata JSONB DEFAULT '{}',
                is_public BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Exports table 'exports' is ready.");

        // Handle existing tables by adding columns safely
        try { await pool.query(`ALTER TABLE exports ADD COLUMN metadata JSONB DEFAULT '{}'`); } catch(e) {}
        try { await pool.query(`ALTER TABLE exports ADD COLUMN is_public BOOLEAN DEFAULT TRUE`); } catch(e) {}

        // Speed up lookups
        await pool.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_datasets_user ON datasets(user_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_chat_dataset ON chat_histories(dataset_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_dashboards_user ON dashboards(user_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_collab_dataset ON dataset_collaborators(dataset_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_collab_user ON dataset_collaborators(user_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_collab_token ON dataset_collaborators(invite_token)');
        console.log("Indices created successfully.");
    } catch (err) {
        console.error("Error creating datasets table:", err);
    }
}

module.exports = setup;
