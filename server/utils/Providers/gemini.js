const { GoogleGenerativeAI } = require("@google/generative-ai");

const generateWithGemini = async ({
  prompt,
  schemaText,
  dialect = "PostgreSQL",
  historyText = "",
  rlsInstruction = "",
  responseSchema,
  userKey
}) => {
  try {
    const finalKey = userKey || process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(finalKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // fast + stable
      generationConfig: {
        temperature: 0.0,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
      systemInstruction: `
You are a Principal Data Engineer and Lead BI Analyst.
Your job is to translate user natural language into highly optimized, production-ready ${dialect} queries.

DATABASE CONTEXT:
${schemaText}
${rlsInstruction}

STRICT SQL DIRECTIVES:
1. DIALECT ACCURACY: Use functions specific to ${dialect}.
2. MULTI-TABLE JOINS: Use JOIN when needed.
3. ADVANCED ANALYTICS: Use CTEs (WITH) and window functions if required.
4. AGGREGATIONS: Always alias aggregated fields.
5. PERFORMANCE: Limit non-aggregated results to 500 rows.
6. NULL FILTERING: Exclude NULL grouping values.
7. READ-ONLY: Never generate INSERT, UPDATE, DELETE, DROP.

CHART RULES:
- line/area → trends
- bar → comparisons
- pie → distribution
- table → raw data

LANGUAGE:
Match user tone and language.
      `,
    });

    const fullPrompt = `${historyText}
CURRENT USER PROMPT:
"${prompt}"`;

    console.log(`🧠 Gemini generating SQL for ${dialect}...`);

    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();

    // 🧹 Clean JSON
    const cleanJson = text.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(cleanJson);

    // 🔍 Debug logs
    console.log("--------------------------------------------------");
    console.log(`📊 CHART: ${parsed.chart_type}`);
    console.log(`🔗 JOIN: ${parsed.requires_join}`);
    console.log(`💻 SQL:\n${parsed.sql_query}`);
    console.log("--------------------------------------------------");

    return parsed;

  } catch (error) {
    console.error("❌ Gemini SQL Generation Error:", error.message);

    // 🧠 fallback response
    return {
      chart_type: "table",
      sql_query: "SELECT 1;",
      explanation: "AI failed to generate query.",
      insights: [],
      suggested_follow_ups: [],
      error: error.message
    };
  }
};

module.exports = { generateWithGemini };