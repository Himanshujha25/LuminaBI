const pool = require('../db/db');

// Get all chats for a specific dataset and user
const getChats = async (req, res) => {
    const { datasetId } = req.params;
    const userId = req.user.id;

    try {
        // Check if user has access to this dataset
        const accessCheck = await pool.query(
            `SELECT 1 FROM datasets d 
             LEFT JOIN dataset_collaborators dc ON dc.dataset_id = d.id 
             JOIN users u ON u.id = $2
             WHERE d.id = $1 
               AND (d.user_id = $2 OR (dc.collaborator_email = u.email AND dc.status = 'accepted'))`,
            [datasetId, userId]
        );

        if (accessCheck.rowCount === 0) {
            return res.status(403).json({ error: "Access denied" });
        }

        const result = await pool.query(
            `SELECT * FROM chat_histories 
             WHERE dataset_id = $1 
               AND (user_id = $2 OR user_id = (SELECT user_id FROM datasets WHERE id = $1))
             ORDER BY created_at ASC`,
            [datasetId, userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching chats:", err);
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
};

// Clear all chats for a specific dataset and user
const clearChats = async (req, res) => {
    const { datasetId } = req.params;
    const userId = req.user.id;

    try {
        const roleRes = await pool.query(
            `SELECT u.id,
              CASE WHEN d.user_id = $2 THEN 'owner'
              ELSE (SELECT role FROM dataset_collaborators WHERE dataset_id = d.id AND collaborator_email = u.email AND status = 'accepted' LIMIT 1)
              END as role
             FROM datasets d JOIN users u ON u.id = $2 WHERE d.id = $1`,
            [datasetId, userId]
        );

        if (roleRes.rows[0]?.role?.toLowerCase() === 'viewer') {
            return res.status(403).json({ error: "Viewers cannot clear shared chats." });
        }

        await pool.query(
            'DELETE FROM chat_histories WHERE dataset_id = $1',
            [datasetId]
        );
        res.json({ message: "Chat history cleared successfully" });
    } catch (err) {
        console.error("Error clearing chats:", err);
        res.status(500).json({ error: "Failed to clear chat history" });
    }
};

// Delete specific chat messages
const deleteMessage = async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.id;

    try {
        const msgRes = await pool.query('SELECT dataset_id FROM chat_histories WHERE id = $1', [messageId]);
        if (msgRes.rowCount === 0) return res.status(404).json({ error: "Message not found" });
        const datasetId = msgRes.rows[0].dataset_id;

        const roleRes = await pool.query(
            `SELECT u.id,
              CASE WHEN d.user_id = $2 THEN 'owner'
              ELSE (SELECT role FROM dataset_collaborators WHERE dataset_id = d.id AND collaborator_email = u.email AND status = 'accepted' LIMIT 1)
              END as role
             FROM datasets d JOIN users u ON u.id = $2 WHERE d.id = $1`,
            [datasetId, userId]
        );

        if (roleRes.rows[0]?.role?.toLowerCase() === 'viewer') {
            return res.status(403).json({ error: "Viewers cannot delete messages." });
        }

        await pool.query(
            'DELETE FROM chat_histories WHERE id = $1',
            [messageId]
        );
        res.json({ message: "Message deleted successfully" });
    } catch (err) {
        console.error("Error deleting message:", err);
        res.status(500).json({ error: "Failed to delete message" });
    }
};

module.exports = {
    getChats,
    clearChats,
    deleteMessage
};
