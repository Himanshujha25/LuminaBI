const { GoogleGenerativeAI } = require("@google/generative-ai");

const generateWithGemini = async (prompt, userKey) => {
  const finalKey = userKey || process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(finalKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.05,
      topP: 0.9,
      topK: 20,
    },
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  const cleanJson = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleanJson);
};

module.exports = { generateWithGemini };