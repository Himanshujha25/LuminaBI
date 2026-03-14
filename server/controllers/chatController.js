const pool = require('../db/db');

// Get all chats for a specific dataset and user
const getChats = async (req, res) => {
    const { datasetId } = req.params;
    const userId = req.user.id;

    try {
        const result = await pool.query(
            'SELECT * FROM chat_histories WHERE dataset_id = $1 AND user_id = $2 ORDER BY created_at ASC',
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
        await pool.query(
            'DELETE FROM chat_histories WHERE dataset_id = $1 AND user_id = $2',
            [datasetId, userId]
        );
        res.json({ message: "Chat history cleared successfully" });
    } catch (err) {
        console.error("Error clearing chats:", err);
        res.status(500).json({ error: "Failed to clear chat history" });
    }
};

// Delete specific chat messages (often we might delete a pair of user+ai, frontend handles calling the API for both)
const deleteMessage = async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.id;

    try {
        await pool.query(
            'DELETE FROM chat_histories WHERE id = $1 AND user_id = $2',
            [messageId, userId]
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
