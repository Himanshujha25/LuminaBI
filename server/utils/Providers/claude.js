const generateWithClaude = async (prompt, userKey) => {
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: userKey });

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      temperature: 0.05,
      messages: [{ role: "user", content: prompt }]
    });

    const responseText = message.content[0].text;
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      return { error: "Claude support requires @anthropic-ai/sdk. Run: npm install @anthropic-ai/sdk" };
    }
    throw err;
  }
};

module.exports = { generateWithClaude };