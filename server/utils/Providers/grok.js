const OpenAI = require("openai");

const generateWithGrok = async (prompt, userKey) => {
  const openai = new OpenAI({
    apiKey: userKey,
    baseURL: "https://api.x.ai/v1"
  });

  const completion = await openai.chat.completions.create({
    model: "grok-beta",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.05,
    response_format: { type: "json_object" }
  });

  const responseText = completion.choices[0].message.content;
  const cleanJson = responseText.replace(/```json|```/g, "").trim();
  return JSON.parse(cleanJson);
};

module.exports = { generateWithGrok };