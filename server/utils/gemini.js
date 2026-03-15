const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateSQL(prompt, tableName, columnsInfo, history = []) {
  // Build chat context from history
  let chatContext = "";
  if (history && history.length > 0) {
    chatContext = "\n\n--- PREVIOUS CONVERSATION CONTEXT ---\n(Use this for follow-up understanding. If the user asks to filter or change the previous result, modify that SQL.):\n";
    history.forEach(msg => {
      chatContext += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}\n`;
      if (msg.role === 'ai' && msg.data?.sql_used) {
        chatContext += `[SQL Generated: ${msg.data.sql_used}]\n`;
      }
    });
  }

  const schemaDescription = columnsInfo.map(c =>
    `- ${c.original} (DB column: "${c.name}", Type: ${c.type})`
  ).join('\n');

  // Full prompt sent to model (all context packed into the content, not systemInstruction)
  const fullPrompt = `You are a Senior Data Analyst and SQL Expert. Provide accurate, analytical, and visually useful insights.

DATASET INFO:
- Table: "${tableName}"
- Columns:
${schemaDescription}

SQL RULES:
1. Text searches: use ILIKE '%term%' for case-insensitive matching.
2. Aggregates: use SUM, AVG, COUNT for "total", "average", "breakdown" queries.
3. Aliases: use clear double-quoted aliases (e.g. SELECT "category" AS "Category").
4. Ordering: "top"/"best"/"highest" → ORDER BY DESC; "bottom"/"least" → ORDER BY ASC.
5. Limits: default LIMIT 15 for charts, LIMIT 100 for table views.
6. No joins with other tables — only use "${tableName}".
7. Always wrap column/table names in double quotes for PostgreSQL safety.

CHART SELECTION:
- bar: comparing quantities across categories
- line: trends over time/dates
- pie: part-to-whole breakdown (top 6 only)
- area: cumulative totals over time
- table: raw lists, 3+ columns, "show all"

MANDATORY JSON RESPONSE FORMAT (no markdown, just raw JSON):
{
  "is_data_query": boolean,
  "sql_query": "string — valid PostgreSQL",
  "chart_type": "bar" | "line" | "pie" | "area" | "table",
  "x_axis_column": "string — alias used for X axis",
  "y_axis_column": "string — alias used for Y axis",
  "explanation": "string — professional 1-3 sentence insight",
  "suggested_follow_ups": ["string", "string", "string"]
}

If columns don't exist for the question, return:
{ "error": "I couldn't find relevant columns for that question." }
${chatContext}

USER QUESTION: ${prompt}`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const result = await model.generateContent(fullPrompt);
    let text = result.response.text().trim();

    // Strip markdown code fences if present
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    const parsed = JSON.parse(text);

    if (parsed.is_data_query && !parsed.sql_query && !parsed.error) {
      parsed.error = "I understand the request but couldn't generate a stable SQL query.";
    }

    return parsed;
  } catch (error) {
    console.error("Failed to generate AI response:", error.message || error);
    // Return a structured error instead of throwing (prevents server crash)
    return { error: "AI service error: " + (error.message || "Unknown error") };
  }
}

module.exports = generateSQL;
