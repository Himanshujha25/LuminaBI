const pool = require('../db/db');

exports.saveDashboard = async (req, res) => {
    try {
        const { name, layout, charts, dataset_id } = req.body;
        const userId = req.user.id;

        if (!name || !layout || !charts) {
            return res.status(400).json({ error: "Missing required fields: name, layout, or charts." });
        }

        const result = await pool.query(
            `INSERT INTO dashboards (user_id, name, layout, charts, dataset_id) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [userId, name, JSON.stringify(layout), JSON.stringify(charts), dataset_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error saving dashboard:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getDashboards = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            "SELECT * FROM dashboards WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching dashboards:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.deleteDashboard = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await pool.query(
            "DELETE FROM dashboards WHERE id = $1 AND user_id = $2 RETURNING id",
            [id, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Dashboard not found or unauthorized" });
        }

        res.json({ message: "Dashboard deleted successfully", id });
    } catch (err) {
        console.error("Error deleting dashboard:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
