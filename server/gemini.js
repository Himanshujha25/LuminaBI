const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * ENTERPRISE AI SQL GENERATOR
 * Handles multi-table joins, dialect-specific syntax, and advanced analytics.
 * * @param {string} prompt - The user's natural language question.
 * @param {Object} dbContext - Complex database schema (tables, foreign keys, relationships).
 * @param {string} dialect - "PostgreSQL", "Snowflake", "MySQL", or "BigQuery".
 * @param {Array} history - Previous chat context for follow-up questions.
 * @param {Object} userContext - Context like user_id or tenant_id for Row-Level Security.
 */
async function generateEnterpriseSQL(
  prompt, 
  dbContext = {
    tables: [
      { name: "users", columns: "id, name, signup_date, country, subscription_tier" },
      { name: "payments", columns: "id, user_id, amount, payment_date, status" },
      { name: "web_events", columns: "id, user_id, event_type, url, timestamp" }
    ],
    relationships: [
      "payments.user_id = users.id",
      "web_events.user_id = users.id"
    ]
  }, 
  dialect = "PostgreSQL", 
  history = [],
  userContext = { tenantId: null } // Used to inject mandatory WHERE clauses for SaaS
) {
  
  // 1. FORMAT CHAT HISTORY (Contextual Memory)
  const historyText = history.length > 0 
    ? `\n--- PREVIOUS CONVERSATION CONTEXT ---\n${history.map(msg => `${msg.role.toUpperCase()}: ${msg.text}`).join('\n')}\n-----------------------------------\n` 
    : "";

  // 2. FORMAT COMPLEX SCHEMA
  const schemaText = `
TABLES:
${dbContext.tables.map(t => `- ${t.name} (${t.columns})`).join('\n')}

RELATIONSHIPS (JOIN KEYS):
${dbContext.relationships.map(r => `- ${r}`).join('\n')}
  `;

  // 3. ROW LEVEL SECURITY (Mandatory Tenant Filtering)
  const rlsInstruction = userContext.tenantId 
    ? `\nCRITICAL SECURITY RULE: You MUST append 'WHERE tenant_id = ${userContext.tenantId}' to the base table of every query.` 
    : "";

  // 4. DEFINE THE MASSIVE JSON SCHEMA
  const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      is_data_query: { type: SchemaType.BOOLEAN, description: "True if asking for data analysis. False if general chat or malicious." },
      confidence_score: { type: SchemaType.NUMBER, description: "Scale 0.0 to 1.0 representing confidence in the accuracy of this SQL." },
      sql_query: { type: SchemaType.STRING, description: `The exact ${dialect} query.` },
      requires_join: { type: SchemaType.BOOLEAN, description: "Did this query require joining multiple tables?" },
      chart_type: { 
        type: SchemaType.STRING, 
        description: "Must be: bar, line, pie, area, scatter, heatmap, funnel, radar, kpi, or table" 
      },
      chart_config: {
        type: SchemaType.OBJECT,
        properties: {
          x_axis: { type: SchemaType.STRING, description: "Column alias for the X-axis/Categories." },
          y_axis: { type: SchemaType.STRING, description: "Column alias for the primary Y-axis/Values." },
          z_axis_or_group: { type: SchemaType.STRING, description: "Optional column alias for grouping (e.g., stacked bar, multi-line) or heatmap intensity." }
        }
      },
      insights: { 
        type: SchemaType.ARRAY, 
        items: { type: SchemaType.STRING },
        description: "2-3 bullet points of what the user should look for in this data." 
      },
      explanation: { type: SchemaType.STRING, description: "Friendly explanation of the query logic." },
      suggested_follow_ups: { 
        type: SchemaType.ARRAY, 
        items: { type: SchemaType.STRING },
        description: "3 highly analytical follow-up questions driving deeper insights."
      }
    },
    required: ["is_data_query", "sql_query", "chart_type", "chart_config", "insights", "explanation", "suggested_follow_ups"]
  };

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro", // Upgraded to 'pro' for maximum reasoning on complex schemas
    generationConfig: {
      temperature: 0.0, // Zero creativity, maximum precision
      responseMimeType: "application/json",
      responseSchema: responseSchema
    },
    systemInstruction: `You are a Principal Data Engineer and Lead BI Analyst.
Your job is to translate user natural language into highly optimized, production-ready ${dialect} queries.

DATABASE CONTEXT:
${schemaText}
${rlsInstruction}

STRICT SQL DIRECTIVES:
1. DIALECT ACCURACY: Use functions specific to ${dialect}. (e.g., DATE_TRUNC for Postgres, DATE_FORMAT for MySQL, ILIKE for Postgres but LIKE for MySQL).
2. MULTI-TABLE JOINS: If a question spans multiple topics (e.g., "Show payments by user country"), you MUST use the provided RELATIONSHIPS to write an INNER or LEFT JOIN.
3. ADVANCED ANALYTICS: Use Common Table Expressions (WITH clauses) for complex multi-step queries. Use Window Functions (OVER, PARTITION BY) if the user asks for running totals, moving averages, or rank.
4. AGGREGATIONS & ALIASES: You MUST use aggregate functions (SUM, AVG, COUNT) when grouping. NEVER leave aggregated columns un-aliased. Use clean aliases like 'total_revenue' or 'user_count'. Do not use spaces in aliases.
5. PERFORMANCE LIMIT: ALWAYS limit non-aggregated row returns to a maximum of 500 rows to prevent dashboard crashes.
6. NULL FILTERING: Exclude NULLs from grouping columns (e.g., WHERE country IS NOT NULL).
7. READ-ONLY SECURITY: Never generate INSERT, UPDATE, DELETE, DROP, or ALTER. 

CHART SELECTION ALGORITHM:
- 'line' / 'area': Time-series trends (days, months).
- 'pie': Percentage breakdowns of a whole (Top 5-8 categories max).
- 'bar': Comparing quantities across categories.
- 'heatmap': Matrix comparisons (e.g., Day of Week vs Hour of Day).
- 'funnel': Conversion rates (e.g., Web Event A -> Web Event B -> Payment).
- 'kpi': A single massive number request (e.g., "What is our total revenue?").
- 'table': Raw data dumps or when returning more than 3 columns.

LANGUAGE MIRRORING:
Write the 'explanation', 'insights', and 'suggested_follow_ups' in the exact language or tone the user is speaking.`
  });

  try {
    const fullPrompt = `${historyText}\nCURRENT USER PROMPT:\n"${prompt}"`;
    
    console.log(`🧠 AI is analyzing complex schema for ${dialect}...`);
    const result = await model.generateContent(fullPrompt);
    const rawText = result.response.text();
    
    const parsedData = JSON.parse(rawText);
    
    // Safety Log
    console.log("--------------------------------------------------");
    console.log(`📊 CHART TYPE: ${parsedData.chart_type.toUpperCase()}`);
    console.log(`🛠️ DIALECT: ${dialect}`);
    console.log(`🔗 REQUIRES JOIN: ${parsedData.requires_join}`);
    console.log(`💻 SQL GENERATED:\n${parsedData.sql_query}`);
    console.log("--------------------------------------------------");
    
    return parsedData;
    
  } catch (error) {
    console.error("❌ Failed to generate Enterprise AI response:", error);
    // Auto-fallback logic could go here
    throw error;
  }
}

module.exports = generateEnterpriseSQL;