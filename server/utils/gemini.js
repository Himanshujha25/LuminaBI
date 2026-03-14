const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateSQL(prompt, tableName, columnsInfo, history = []) {
  let chatContext = "";
  if (history && history.length > 0) {
      chatContext = "\n\n--- PREVIOUS CONVERSATION CONTEXT ---\n(Use this to understand follow-up requests. If the user asks to filter, sort, or change the chart type of the previous result, apply it to the previous SQL query!):\n";
      history.forEach(msg => {
         chatContext += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}\n`;
         if (msg.role === 'ai' && msg.data?.sql_used) {
             chatContext += `[Assistant SQL Generated: ${msg.data.sql_used}]\n`;
         }
      });
  }

  // Build a more descriptive schema context
  const schemaDescription = columnsInfo.map(c => `- ${c.original} (Database name: "${c.name}", Type: ${c.type})`).join('\n');

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // Corrected model ID
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1, // Lower temperature for more deterministic/accurate SQL
    },
    systemInstruction: `You are a Senior Data Analyst and SQL Expert. Your goal is to provide highly accurate, analytical, and visually useful insights from a dataset.

CORE DATASET INFO:
- Current Table Name: "${tableName}"
- Available Columns (Original CSV Name -> Database Column):
${schemaDescription}

STRICT SQL RULES FOR MAXIMUM ACCURACY:
1. FUZZY SEARCH: When searching for names, categories, or text (like "Himanshu", "Sales", "Tech"), ALWAYS use "ILIKE '%<term>%'" for case-insensitive partial matches. This is critical for accuracy.
2. AGGREGATES: Always default to meaningful aggregations (SUM, AVG, COUNT) when the user asks for "total", "average", "how many", or "breakdown".
3. ALIASES: Use clear, double-quoted aliases for your columns (e.g., SELECT "${columnsInfo[0]?.name}" AS "Category", COUNT(*) AS "Total" ...).
4. ORDERING: If the user asks for "top", "best", "highest", or "most", always ORDER BY DESC. If "bottom" or "least", ORDER BY ASC.
5. LIMITS: For charts, if not specified, LIMIT to the top 15 results to keep the visualization clean. For tables, LIMIT to 100.
6. JOINING: Do NOT try to join other tables; only use the provided schema for "${tableName}".
7. ESCAPING: ALWAYS wrap column names and table names in double quotes (") to handle special characters or reserved words in PostgreSQL.

CHART SELECTION LOGIC:
- Use 'bar' for comparing quantities across categories.
- Use 'line' for trends over time/dates.
- Use 'pie' for part-to-whole breakdowns (limit to top 6 categories).
- Use 'area' for cumulative totals over time.
- Use 'table' for raw lists, contact details, "show everything", or when more than 3 columns are requested.

JSON RESPONSE FORMAT (MANDATORY):
{
  "is_data_query": boolean, // True if the user prompt requires a database query.
  "sql_query": string, // The optimized PostgreSQL query. Wrap everything in double quotes.
  "chart_type": "bar" | "line" | "pie" | "area" | "table", 
  "x_axis_column": string, // The alias used for the X-axis in your SQL.
  "y_axis_column": string, // The alias used for the Y-axis in your SQL.
  "explanation": string, // A proactive, professional summary of what this data shows.
  "suggested_follow_ups": string[] // 3 intelligent follow-up questions to dig deeper into "this" specific data.
}

If you cannot answer the question because the columns don't exist, return: { "error": "I couldn't find relevant columns in the dataset to answer that question." }

USER PROMPT: ${prompt}
${chatContext}`
  });

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    // Clean up if it returned markdown
    if(text.startsWith('```json')) {
        text = text.replace('```json', '').replace('```', '').trim();
    }
    const parsed = JSON.parse(text);
    
    // Safety check for keys
    if (parsed.is_data_query && !parsed.sql_query && !parsed.error) {
       parsed.error = "I understand the request but couldn't generate a stable query.";
    }

    return parsed;
  } catch (error) {
    console.error("Failed to generate AI response:", error);
    throw error;
  }
}

module.exports = generateSQL;
