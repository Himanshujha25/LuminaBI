const NodeCache = require("node-cache");

// Cache durations:
// - Schema: 1 hour (rarely changes)
// - Insights: 10 minutes (prevents duplicate AI calls for same session/prompt)
const schemaCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });
const insightCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

module.exports = {
  schemaCache,
  insightCache
};
