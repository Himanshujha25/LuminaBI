const OpenAI = require("openai");

const generateWithPerplexity = async (prompt, userKey) => {
  const openai = new OpenAI({
    apiKey: userKey,
    baseURL: "https://api.perplexity.ai"
  });

  const completion = await openai.chat.completions.create({
    model: "llama-3.1-sonar-large-128k-online",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.05
    // Note: Perplexity doesn't support response_format
  });

  const responseText = completion.choices[0].message.content;
  const cleanJson = responseText.replace(/```json|```/g, "").trim();
  return JSON.parse(cleanJson);
};

module.exports = { generateWithPerplexity };