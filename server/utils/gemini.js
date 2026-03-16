const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─────────────────────────────────────────────
// CHART SELECTION DECISION TREE (used in prompt)
// ─────────────────────────────────────────────
const CHART_RULES = `
CHART SELECTION — follow this decision tree strictly:

1. Is the user asking for raw rows, a list, or 3+ columns of mixed data?
   → "table"

2. Is the X-axis a DATE or TIME field (month, year, day, quarter)?
   - If values accumulate over time (revenue, signups, sales) → "area"
   - If values fluctuate (temperature, stock price, score)    → "line"

3. Is the X-axis a CATEGORY (name, region, product, status)?
   - If comparing quantities across categories               → "bar"
   - If showing share/proportion (top 6 max, sums to 100%)  → "pie"
   - If many categories (>8) or negative values present     → "bar" (never pie)

4. Showing distribution/ranking of a single metric?
   → "bar" (sorted DESC)

5. Part-to-whole relationship with ≤6 groups?
   → "pie"

DEFAULT fallback: "bar"

NEVER use pie for:
- Time series data
- More than 6 slices
- Data with negative values
- Queries with WHERE clauses that return many groups
`;

// ─────────────────────────────────────────────
// HISTORY FORMATTER
// ─────────────────────────────────────────────
function buildHistoryContext(history) {
  if (!history || history.length === 0) return "";

  const lines = history
    .slice(-6) // last 3 turns (user + ai pairs) — avoid token bloat
    .map((msg) => {
      const role = msg.role === "user" ? "User" : "Assistant";
      let line = `${role}: ${msg.text}`;
      if (msg.role === "ai" && msg.data?.sql_used) {
        line += `\n  [SQL: ${msg.data.sql_used}]`;
      }
      return line;
    })
    .join("\n");

  return `
--- CONVERSATION HISTORY (last ${Math.min(history.length, 6)} messages) ---
Use this ONLY to understand follow-up intent (e.g. "filter that", "show top 5", "break it down by region").
If a follow-up modifies a previous query, build on the SQL shown in [SQL: ...] tags.
Do NOT repeat old results — generate fresh SQL for the new intent.

${lines}
--- END HISTORY ---
`;
}

// ─────────────────────────────────────────────
// SCHEMA FORMATTER
// ─────────────────────────────────────────────
function buildSchemaDescription(columnsInfo) {
  return columnsInfo
    .map((c) => {
      const hint = getColumnHint(c.type);
      return `  - "${c.name}" (display: "${c.original}", type: ${c.type}${hint})`;
    })
    .join("\n");
}

function getColumnHint(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("date") || t.includes("time") || t.includes("timestamp"))
    return " ← use for time-series / line / area charts";
  if (t.includes("int") || t.includes("float") || t.includes("numeric") || t.includes("decimal"))
    return " ← use for Y-axis / aggregations";
  if (t.includes("bool"))
    return " ← use for grouping / filtering (TRUE/FALSE)";
  if (t.includes("text") || t.includes("varchar") || t.includes("char"))
    return " ← use for X-axis / grouping / ILIKE searches";
  return "";
}

// ─────────────────────────────────────────────
// MAIN PROMPT BUILDER
// ─────────────────────────────────────────────
function buildPrompt(prompt, tableName, columnsInfo, history) {
  const schema = buildSchemaDescription(columnsInfo);
  const historyContext = buildHistoryContext(history);

  return `You are an expert Data Analyst and PostgreSQL engineer embedded in a business intelligence tool.
Your job: convert a natural language question into a precise SQL query AND choose the best visualization.

════════════════════════════════════════
DATASET SCHEMA
════════════════════════════════════════
Table: "${tableName}"
Columns:
${schema}

════════════════════════════════════════
SQL GENERATION RULES
════════════════════════════════════════
1. ONLY query the table "${tableName}" — no JOINs, no subqueries with other tables.
2. Always double-quote column and table names: SELECT "column_name" FROM "${tableName}".
3. Use clear, human-readable aliases:
     SELECT SUM("revenue") AS "Total Revenue", "region" AS "Region"
4. Text matching: always use ILIKE '%term%' (never LIKE, never =).
5. Aggregation keywords:
     "total / sum"     → SUM(...)
     "average / mean"  → AVG(...)
     "count / how many"→ COUNT(*)
     "minimum / lowest"→ MIN(...)
     "maximum / highest"→ MAX(...)
6. Sorting:
     "top / best / highest / most"  → ORDER BY [metric] DESC
     "bottom / worst / lowest / least" → ORDER BY [metric] ASC
7. Default LIMIT:
     - Chart queries        → LIMIT 15
     - Table/list queries   → LIMIT 100
     - "Top N" queries      → LIMIT exactly N
8. Date/time formatting:
     - Group by month       → TO_CHAR("date_col", 'YYYY-MM') AS "Month"
     - Group by year        → EXTRACT(YEAR FROM "date_col")::INT AS "Year"
     - Group by quarter     → 'Q' || EXTRACT(QUARTER FROM "date_col")::TEXT AS "Quarter"
9. Null safety: use COALESCE where aggregation might hit NULLs.
10. Never use SELECT * for aggregation queries — be explicit about columns.

════════════════════════════════════════
${CHART_RULES}
════════════════════════════════════════
AXIS RULES
════════════════════════════════════════
- x_axis_column: the alias of the categorical/time column (what's on the X-axis or pie slices)
- y_axis_column: the alias of the numeric/aggregated column (what's measured)
- For "table" chart type: set both x_axis_column and y_axis_column to the first two column aliases.
- Always use the ALIAS (right side of AS), not the raw DB column name.

════════════════════════════════════════
RESPONSE FORMAT — respond ONLY with raw JSON, no markdown, no explanation outside JSON
════════════════════════════════════════
{
  "is_data_query": boolean,          // true if this needs a DB query, false for greetings/chitchat
  "sql_query": "string",             // valid PostgreSQL; null if is_data_query=false
  "chart_type": "bar"|"line"|"pie"|"area"|"table",
  "x_axis_column": "string",         // alias from sql_query
  "y_axis_column": "string",         // alias from sql_query
  "chart_reasoning": "string",       // 1 sentence: WHY you chose this chart type
  "explanation": "string",           // 2-3 sentence professional insight about what this data will show
  "suggested_follow_ups": ["string", "string", "string"]  // 3 relevant follow-up questions
}

If the user asks something unrelated to the data (greeting, general question):
{
  "is_data_query": false,
  "sql_query": null,
  "chart_type": null,
  "x_axis_column": null,
  "y_axis_column": null,
  "chart_reasoning": null,
  "explanation": "string — friendly response",
  "suggested_follow_ups": ["string", "string", "string"]
}

If relevant columns genuinely don't exist for this question:
{
  "error": "string — explain what's missing and suggest what the user could ask instead"
}
${historyContext}
════════════════════════════════════════
USER QUESTION: ${prompt}
════════════════════════════════════════`;
}

// ─────────────────────────────────────────────
// SAFE JSON EXTRACTOR
// ─────────────────────────────────────────────
function extractJSON(raw) {
  if (!raw || typeof raw !== "string") return null;

  let text = raw.trim();

  // Strip markdown code fences
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch (_) {}

  // Attempt to extract first {...} block (handles extra surrounding text)
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch (_) {}
  }

  return null;
}

// ─────────────────────────────────────────────
// RESPONSE VALIDATOR
// ─────────────────────────────────────────────
function validateResponse(parsed) {
  if (!parsed || typeof parsed !== "object") {
    return { error: "AI returned an unreadable response. Please try again." };
  }

  // Pass through explicit errors from the model
  if (parsed.error) return parsed;

  // Non-data query — just needs explanation
  if (parsed.is_data_query === false) {
    return {
      ...parsed,
      sql_query: null,
      chart_type: null,
      x_axis_column: null,
      y_axis_column: null,
    };
  }

  // Data query validations
  if (!parsed.sql_query || typeof parsed.sql_query !== "string") {
    return { error: "Could not generate a valid SQL query for this question. Please rephrase." };
  }

  const validCharts = ["bar", "line", "pie", "area", "table"];
  if (!validCharts.includes(parsed.chart_type)) {
    parsed.chart_type = "bar"; // safe fallback
  }

  if (!parsed.x_axis_column || !parsed.y_axis_column) {
    return { error: "Could not determine chart axes. Try rephrasing your question." };
  }

  // Sanitize sql_query — strip any trailing semicolons for safety
  parsed.sql_query = parsed.sql_query.trim().replace(/;+$/, "");

  return parsed;
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────
async function generateSQL(prompt, tableName, columnsInfo, history = []) {
  const fullPrompt = buildPrompt(prompt, tableName, columnsInfo, history);

  try {
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
    const rawText = result.response.text();

    const parsed = extractJSON(rawText);

    if (!parsed) {
      console.error("[gemini.js] Failed to parse JSON from model output:", rawText?.slice(0, 300));
      return { error: "AI returned malformed JSON. Please try again." };
    }

    return validateResponse(parsed);

  } catch (error) {
    const msg = error?.message || "Unknown error";
    console.error("[gemini.js] API error:", msg);

    // Surface quota/auth errors clearly
    if (msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
      return { error: "API quota exceeded. Please wait a moment and try again." };
    }
    if (msg.includes("API_KEY") || msg.includes("401")) {
      return { error: "Invalid Gemini API key. Check your .env configuration." };
    }

    return { error: `AI service error: ${msg}` };
  }
}

module.exports = generateSQL;