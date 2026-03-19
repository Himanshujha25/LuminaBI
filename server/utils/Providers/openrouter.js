const OpenAI = require("openai");

const generateWithOpenRouter = async (prompt, userKey) => {
  const openai = new OpenAI({
    apiKey: userKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://luminabi.app",
      "X-Title": "LuminaBI"
    }
  });

  const completion = await openai.chat.completions.create({
    model: "openai/gpt-4o-2024-11-20",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.05,
    response_format: { type: "json_object" }
  });

  const responseText = completion.choices[0].message.content;
  const cleanJson = responseText.replace(/```json|```/g, "").trim();
  return JSON.parse(cleanJson);
};

module.exports = { generateWithOpenRouter };