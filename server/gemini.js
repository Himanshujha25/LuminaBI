const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateSQL(prompt) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json", // Force JSON output
    },
    systemInstruction: `You are a data analyst and PostgreSQL expert.
    
Table name: videos
Columns: timestamp, video_id, category, language, region, duration_sec, views, likes, comments, shares, sentiment_score, ads_enabled

You must respond with a JSON object containing EXACTLY these keys:
1. "sql_query": A valid PostgreSQL query.
2. "chart_type": Choose "bar", "line", or "pie" based on the data type.
3. "x_axis_column": The column name for the X axis (or pie slices).
4. "y_axis_column": The column name for the Y axis (or pie values).
5. "explanation": A 1-sentence business explanation of the insight.

If the prompt asks something outside the schema, return ONLY: { "error": "I don't have the data to answer that." }`
  });

  try {
    const result = await model.generateContent(prompt);
    // Parse the JSON text returned by Gemini
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Failed to generate AI response:", error);
    throw error;
  }
}

module.exports = generateSQL;