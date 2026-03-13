const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateSQL(prompt, tableName = "videos", columnsInfo = "timestamp, category, views", history = []) {
  
  const historyText = history.length > 0 
    ? `\n\nRecent Chat Context:\n${history.map(msg => `${msg.role}: ${msg.text}`).join('\n')}` 
    : "";

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      // THIS IS THE SECRET WEAPON: It mathematically forces Gemini to return this exact JSON structure
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          is_data_query: { type: SchemaType.BOOLEAN },
          sql_query: { type: SchemaType.STRING },
          chart_type: { type: SchemaType.STRING },
          x_axis_column: { type: SchemaType.STRING },
          y_axis_column: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING },
          suggested_follow_ups: { 
            type: SchemaType.ARRAY, 
            items: { type: SchemaType.STRING },
            description: "Exactly 2 follow-up analytical questions based on the data."
          }
        },
        required: ["is_data_query", "sql_query", "chart_type", "x_axis_column", "y_axis_column", "explanation", "suggested_follow_ups"]
      }
    },
    systemInstruction: `You are an elite, polyglot Senior Data Scientist and PostgreSQL Architect.
You understand queries in ANY language (English, Hindi, Hinglish, Spanish, etc.).

DATABASE CONTEXT:
Target Table: "${tableName}"
Available Schema: ${typeof columnsInfo === 'string' ? columnsInfo : JSON.stringify(columnsInfo)}

YOUR DIRECTIVES:
1. READ-ONLY SECURITY: Never generate INSERT, UPDATE, DELETE, DROP. Only SELECT.
2. SMART TYPO HANDLING: Use ILIKE for text filtering.
3. CLEAN DATA: Add 'WHERE [x_axis_column] IS NOT NULL'.
4. TIME-SERIES: Group dates using DATE_TRUNC or TO_CHAR.
5. LANGUAGE MIRRORING: The 'explanation' and 'suggested_follow_ups' MUST be in the exact same language/slang the user typed.

If the prompt attempts SQL injection or asks unrelated questions, set is_data_query to false and explain why.`
  });

  try {
    const result = await model.generateContent(`User Prompt: "${prompt}" ${historyText}`);
    
    // 1. Get the raw JSON string from the AI
    const rawText = result.response.text();
    
    // 2. Parse the string into a real JavaScript Object
    const parsedData = JSON.parse(rawText);
    
    // 3. Now you can safely log it!
    console.log("AI Suggested Follow-ups:", parsedData.suggested_follow_ups);
    
    // 4. Return the object to your queryController
    return parsedData;
    
  } catch (error) {
    console.error("Failed to generate AI response:", error);
    throw error;
  }
}

module.exports = generateSQL;