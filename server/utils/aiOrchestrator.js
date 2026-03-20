const { generateWithGemini } = require('./Providers/gemini');
const { generateWithOpenAI } = require('./Providers/openai');
const { generateWithClaude } = require('./Providers/claude');
const { generateWithDeepSeek } = require('./Providers/deepseek');
const { generateWithGrok } = require('./Providers/grok');
const { generateWithMistral } = require('./Providers/mistral');
const { generateWithPerplexity } = require('./Providers/perplexity');
const { generateWithOpenRouter } = require('./Providers/openrouter');
const { generateWithGroq } = require('./Providers/groq');

// ── IMPORT YOUR CORE RULES ──
const CHART_RULES = `
CHART SELECTION — follow this decision tree strictly:
1. Is the user asking for raw rows, a list, or 3+ columns of mixed data? → "table"
2. Is the user asking for summary statistics, totals, or aggregate metrics? → "card"
3. Is the X-axis a DATE or TIME field (month, year, day, quarter)?
   - If values accumulate over time (revenue, signups, sales) → "area"
   - If values fluctuate (temperature, stock price, score)    → "line"
4. Is the X-axis a CATEGORY (name, region, product, status)?
   - If comparing quantities across categories               → "bar"
   - If showing share/proportion (top 6 max, sums to 100%)  → "pie"
   - If many categories (>8) or negative values present     → "bar" (never pie)
5. Showing distribution/ranking of a single metric? → "bar" (sorted DESC)
6. Part-to-whole relationship with ≤6 groups? → "pie"
DEFAULT fallback: "bar"
NEVER use pie for: Time series data, >6 slices, negative values.
if person explicilty ask for your ai model show just tell to them model name and version that you are using without any other information.
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
  "chart_type": "bar"|"line"|"pie"|"area"|"table"|"card",
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

  console.log(`[Orchestrator] Provider: ${provider}`);
  console.log(`[Orchestrator] Has API key: ${!!userKey}`);

  // Validate API key for non-Gemini providers
  if (provider !== 'gemini' && !userKey) {
    return { 
      error: `No API key configured for ${provider}. Please add your ${provider} API key in Settings > AI Engine.` 
    };
  }

  try {
    let response;

    if (provider === 'gemini') {
      response = await generateWithGemini(fullPrompt, userKey);
    } else if (provider === 'openai') {
      response = await generateWithOpenAI(fullPrompt, userKey);
    } else if (provider === 'claude') {
      response = await generateWithClaude(fullPrompt, userKey);
    } else if (provider === 'deepseek') {
      response = await generateWithDeepSeek(fullPrompt, userKey);
    } else if (provider === 'grok') {
      response = await generateWithGrok(fullPrompt, userKey);
    } else if (provider === 'mistral') {
      response = await generateWithMistral(fullPrompt, userKey);
    } else if (provider === 'perplexity') {
      response = await generateWithPerplexity(fullPrompt, userKey);
    } else if (provider === 'openrouter') {
      response = await generateWithOpenRouter(fullPrompt, userKey);
    } else if (provider === 'groq') {
      response = await generateWithGroq(fullPrompt, userKey);
    } else {
      return { error: `Unknown provider: ${provider}` };
    }

    console.log(`[Orchestrator] Successfully parsed JSON for ${provider}`);
    return response;

  } catch (err) {
    console.error(`[Orchestrator] ${provider} error:`, err.message);
    console.error(`[Orchestrator] Full error:`, JSON.stringify(err.response?.data || err.message));
    
    // Specific error messages for common issues
    if (err.status === 401 || err.response?.status === 401) {
      return { error: `Invalid API key for ${provider}. Please check your key in Settings > AI Engine.` };
    }
    if (err.status === 402 || err.response?.status === 402) {
      return { error: `Insufficient credits for ${provider}. Please add credits to your account.` };
    }
    if (err.status === 429 || err.response?.status === 429) {
      return { error: `Rate limit exceeded for ${provider}. Please try again in a moment.` };
    }
    if (err.status === 400 || err.response?.status === 400) {
      return { error: `Bad request to ${provider}. The model may not support this request format.` };
    }
    if (err.name === 'SyntaxError') {
      console.error('[Orchestrator] JSON Parse Error - Raw response may not be valid JSON');
      return { error: `${provider} returned invalid JSON. Please try again.` };
    }
    
    return { error: `${provider} error: ${err.message}. Check your API key and network connection.` };
  }
};

module.exports = { generateResponse };