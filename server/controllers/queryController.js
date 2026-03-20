const pool = require('../db/db');
// We change the import to a more flexible AI orchestrator
const AIOrchestrator = require('../utils/aiOrchestrator')
const { schemaCache, insightCache } = require('../utils/cache');
const crypto = require('crypto');

const handleQuery = async (req, res) => {
    const { prompt, datasetId, history } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!prompt) {
        return res.status(400).json({ error: 'Please provide a prompt.' });
    }

    try {
        let tableName = 'videos';
        let columnsInfo = [];

        // 1. Fetch Dataset Schema & User AI Preferences
        // We now fetch ai_keys and preferred_provider from the users table too
        const userAndDatasetRes = await pool.query(
            `SELECT d.table_name, d.columns, u.ai_keys, u.preferred_provider 
             FROM datasets d 
             JOIN users u ON d.user_id = u.id 
             WHERE d.id = $1 AND u.id = $2`,
            [datasetId, userId]
        );

        if (userAndDatasetRes.rowCount === 0) {
            return res.status(403).json({ error: "Dataset not found or unauthorized" });
        }

        const { table_name, columns, ai_keys, preferred_provider } = userAndDatasetRes.rows[0];
        tableName = table_name;
        columnsInfo = columns;

        console.log('[QueryController] Preferred provider:', preferred_provider);
        console.log('[QueryController] AI keys available:', Object.keys(ai_keys || {}));

        // 2. Check Insight Cache
        const historyHash = history ? crypto.createHash('md5').update(JSON.stringify(history.slice(-3))).digest('hex') : 'no_hist';
        const insightKey = `insight_${userId}_${datasetId || 'default'}_${prompt}_${historyHash}_${preferred_provider}`;
        let aiResponse = insightCache.get(insightKey);

        if (!aiResponse) {
            console.log('[QueryController] Calling AI orchestrator...');
            // --- NEW: THE AI SWITCHBOARD ---
            // Pass the user's preferred provider and their personal keys to the orchestrator
            aiResponse = await AIOrchestrator.generateResponse({
                prompt,
                tableName,
                columnsInfo,
                history,
                provider: preferred_provider || 'gemini',
                userKeys: ai_keys || {}
            });

            console.log('[QueryController] AI Response received:', {
                hasError: !!aiResponse.error,
                isDataQuery: aiResponse.is_data_query,
                hasSqlQuery: !!aiResponse.sql_query
            });

            if (!aiResponse.error) {
                insightCache.set(insightKey, aiResponse);
            }
        } else {
            console.log('[QueryController] Using cached response');
        }

        // 3. Handle AI Hallucinations
        if (aiResponse.error) {
            console.error('[QueryController] AI returned error:', aiResponse.error);
            return res.json({ error: aiResponse.error });
        }

        // 4. Handle General Conversation (is_data_query === false)
        if (aiResponse.is_data_query === false) {
            let userMsgId = null, aiMsgId = null;
            if (datasetId && userId) {
                const uRes = await pool.query(
                    'INSERT INTO chat_histories (user_id, dataset_id, role, text) VALUES ($1, $2, $3, $4) RETURNING id',
                    [userId, datasetId, 'user', prompt]
                );
                userMsgId = uRes.rows[0].id;
                const aRes = await pool.query(
                    'INSERT INTO chat_histories (user_id, dataset_id, role, text, data) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                    [userId, datasetId, 'ai', aiResponse.explanation, JSON.stringify({ suggested_follow_ups: aiResponse.suggested_follow_ups || [] })]
                );
                aiMsgId = aRes.rows[0].id;
            }

            return res.json({
                datasetId,
                prompt,
                userMessageId: userMsgId,
                aiMessageId: aiMsgId,
                data_query: false,
                explanation: aiResponse.explanation,
                suggested_follow_ups: aiResponse.suggested_follow_ups || []
            });
        }

        // 5. Execute the SQL query
        let result;
        try {
            console.log('[QueryController] Executing SQL:', aiResponse.sql_query);
            result = await pool.query(aiResponse.sql_query);
            console.log('[QueryController] SQL executed successfully, rows:', result.rows.length);
        } catch (sqlErr) {
            console.error("❌ SQL Execution Error:", sqlErr.message);
            return res.json({ error: "AI generated an invalid SQL query. " + sqlErr.message });
        }

        // 6. Save to Chat History & Response
        let userMsgId = null, aiMsgId = null;
        if (datasetId && userId) {
            const uRes = await pool.query(
                'INSERT INTO chat_histories (user_id, dataset_id, role, text) VALUES ($1, $2, $3, $4) RETURNING id',
                [userId, datasetId, 'user', prompt]
            );
            userMsgId = uRes.rows[0].id;

            const aiFullData = {
                chart_type: aiResponse.chart_type,
                x_axis_column: aiResponse.x_axis_column,
                y_axis_column: aiResponse.y_axis_column,
                sql_used: aiResponse.sql_query,
                data: result.rows,
                suggested_follow_ups: aiResponse.suggested_follow_ups || []
            };

            const aRes = await pool.query(
                'INSERT INTO chat_histories (user_id, dataset_id, role, text, data) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [userId, datasetId, 'ai', aiResponse.explanation, JSON.stringify(aiFullData)]
            );
            aiMsgId = aRes.rows[0].id;
        }

        res.json({
            datasetId,
            prompt,
            userMessageId: userMsgId,
            aiMessageId: aiMsgId,
            data_query: true,
            chart_type: aiResponse.chart_type,
            x_axis_column: aiResponse.x_axis_column,
            y_axis_column: aiResponse.y_axis_column,
            explanation: aiResponse.explanation,
            sql_used: aiResponse.sql_query,
            data: result.rows,
            suggested_follow_ups: aiResponse.suggested_follow_ups || [],
            provider_used: preferred_provider // Show the user which AI did the work
        });

        console.log('[QueryController] Response sent successfully');

    } catch (error) {
        console.error("Query Error:", error);
        console.error("Query Error Stack:", error.stack);
        res.status(500).json({ error: "Sorry, I couldn't generate a valid query for that." });
    }
};

module.exports = { handleQuery };