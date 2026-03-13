const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateSQL(prompt, tableName, columnsInfo, history = []) {
  let chatContext = "";
  if (history && history.length > 0) {
      chatContext = "\n\n--- PREVIOUS CONVERSATION CONTEXT ---\n(Use this to understand follow-up requests. If the user asks to filter/change something, apply it to the previous SQL query!):\n";
      history.forEach(msg => {
         chatContext += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}\n`;
         if (msg.role === 'ai' && msg.data?.sql_used) {
             chatContext += `[Assistant SQL Generated: ${msg.data.sql_used}]\n`;
         }
      });
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
    systemInstruction: `You are an expert data analyst and PostgreSQL query optimizer.
    
We are working with a table named: "${tableName}"
Here is the schema mapping (original name -> column name (type)):
${columnsInfo.map(c => `- ${c.original} -> ${c.name} (${c.type})`).join('\n')}

INSTRUCTIONS FOR HIGH ACCURACY SQL QUERY:
- Always use Aggregate Functions (COUNT, SUM, AVG) and apply a GROUP BY when summarizing by categories. Example: SELECT "category", SUM("views") as "total_views" FROM "${tableName}" GROUP BY "category".
- For string/text matching or searching, ALWAYS use ILIKE so searches are case-insensitive. Example: "category" ILIKE '%finance%'.
- If asked for "Top" or "Bottom" results, always include ORDER BY "column_name" DESC/ASC LIMIT <number>. 
- Ensure you wrap actual column names in double quotes exactly as given in the schema mapping, e.g. "${columnsInfo[0]?.name || 'col'}", to avoid syntax issues.
- The SQL query MUST return valid results with clear, simple aliases for the x-axis and y-axis.
- ALWAYS make sure x_axis_column and y_axis_column EXACTLY match the aliases used in your SQL query!

You must respond with a JSON object containing EXACTLY these keys:
1. "is_data_query": boolean. True if the user is asking to query/visualize/analyze the CSV dataset. False if they are just asking a general conversational question to you.
2. "sql_query": A highly accurate PostgreSQL query (or null if is_data_query is false). 
3. "chart_type": Choose "bar", "line", "pie", "area", or "scatter" based on context (or null).
4. "x_axis_column": The exact column alias/name returned by your query for the X axis (or null).
5. "y_axis_column": The exact column alias/name returned by your query for the Y axis (or null).
6. "explanation": If is_data_query is true, a 1-sentence business explanation of the insight. If is_data_query is false, act as a helpful AI assistant and answer their conversational question here like a normal chatbot!

If the prompt asks to query data but it is completely outside the schema provided, return ONLY: { "error": "I don't have the data to answer that." }
${chatContext}`
  });

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text();
    // Clean up if it returned markdown
    if(text.startsWith('```json')) {
        text = text.replace('```json', '').replace('```', '').trim();
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to generate AI response:", error);
    throw error;
  }
}

module.exports = generateSQL;
