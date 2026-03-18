const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");

// ── IMPORT YOUR CORE RULES ──
const CHART_RULES = `
CHART SELECTION — follow this decision tree strictly:
1. Is the user asking for raw rows, a list, or 3+ columns of mixed data? → "table"
2. Is the X-axis a DATE or TIME field (month, year, day, quarter)?
   - If values accumulate over time (revenue, signups, sales) → "area"
   - If values fluctuate (temperature, stock price, score)    → "line"
3. Is the X-axis a CATEGORY (name, region, product, status)?
   - If comparing quantities across categories               → "bar"
   - If showing share/proportion (top 6 max, sums to 100%)  → "pie"
   - If many categories (>8) or negative values present     → "bar" (never pie)
4. Showing distribution/ranking of a single metric? → "bar" (sorted DESC)
5. Part-to-whole relationship with ≤6 groups? → "pie"
DEFAULT fallback: "bar"
NEVER use pie for: Time series data, >6 slices, negative values.
`;

// ── YOUR HELPER FUNCTIONS ──
function getColumnHint(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("date") || t.includes("time") || t.includes("timestamp")) return " ← use for time-series / line / area charts";
  if (t.includes("int") || t.includes("float") || t.includes("numeric") || t.includes("decimal")) return " ← use for Y-axis / aggregations";
  if (t.includes("bool")) return " ← use for grouping / filtering (TRUE/FALSE)";
  if (t.includes("text") || t.includes("varchar") || t.includes("char")) return " ← use for X-axis / grouping / ILIKE searches";
  return "";
}

function buildPrompt(prompt, tableName, columnsInfo, history) {
  const schema = columnsInfo.map(c => `  - "${c.name}" (display: "${c.original}", type: ${c.type}${getColumnHint(c.type)})`).join("\n");
  
  return `You are an expert Data Analyst and PostgreSQL engineer. Return ONLY raw JSON.
Table: "${tableName}"
Columns:
${schema}

SQL RULES:
1. ONLY query "${tableName}".
2. Double-quote all names: SELECT "col" FROM "${tableName}".
3. Use human-readable Aliases (AS "Total Sales").
4. Text: Use ILIKE '%term%'.
5. Default LIMIT 15 for charts, 100 for tables.

${CHART_RULES}

RESPONSE FORMAT (JSON ONLY):
{
  "is_data_query": boolean,
  "sql_query": "string",
  "chart_type": "bar"|"line"|"pie"|"area"|"table",
  "x_axis_column": "string (use the ALIAS)",
  "y_axis_column": "string (use the ALIAS)",
  "explanation": "professional insight",
  "suggested_follow_ups": ["q1", "q2", "q3"]
}

USER QUESTION: ${prompt}`;
}

// ── THE ORCHESTRATOR ──
const generateResponse = async ({ prompt, tableName, columnsInfo, history, provider, userKeys }) => {
  const userKey = userKeys[provider];
  const fullPrompt = buildPrompt(prompt, tableName, columnsInfo, history);

  try {
if (provider === 'gemini') {
  const finalKey = userKey || process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(finalKey);

   const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.05,      // near-zero for deterministic SQL
        topP: 0.9,
        topK: 20,
      },
    });

  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  const text = response.text();

  const cleanJson = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleanJson);
}

    // --- OPENAI COMPATIBLE (DeepSeek, Grok, GPT) ---
    let clientConfig = { apiKey: userKey };
    let modelName = "gpt-4o";

    if (provider === 'deepseek') {
      clientConfig.baseURL = "https://api.deepseek.com";
      modelName = "deepseek-chat";
    } else if (provider === 'grok') {
      clientConfig.baseURL = "https://api.x.ai/v1";
      modelName = "grok-beta";
    }

    const openai = new OpenAI(clientConfig);
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: fullPrompt }],
      temperature: 0.05,
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);

  } catch (err) {
    console.error(`[Orchestrator] ${provider} error:`, err.message);
    return { error: `The ${provider} AI failed. Check your API key or network.` };
  }
};

module.exports = { generateResponse };