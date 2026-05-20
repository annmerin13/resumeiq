// server/utils/checkers/optimizationChecker.js

const Groq = require("groq-sdk");

const checkOptimization = async (text) => {
  const prompt = `
You are an expert resume reviewer. Analyze this resume text and return ONLY a valid JSON object with this exact structure:

{
  "professionalSummary": {
    "score": <0-100>,
    "issues": ["<issue1>", "<issue2>"]
  },
  "atsCompatibility": {
    "score": <0-100>,
    "issues": ["<issue1>"]
  }
}

Scoring criteria:
- professionalSummary: Does it exist? Is it tailored, specific, impactful? Deduct for generic phrases, personal pronouns, or vague language.
- atsCompatibility: Are standard section headers used? No tables/columns mentioned? Keywords present? No special characters or graphics?

Resume text:
"""
${text.substring(0, 3000)}
"""

Return ONLY the JSON. No explanation, no markdown.
`;

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const raw = response.choices[0].message.content.trim();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const categoryScore = Math.round(
      (parsed.professionalSummary.score + parsed.atsCompatibility.score) / 2
    );

    return {
      category: "Optimization",
      score: categoryScore,
      checks: [
        { name: "Professional Summary", score: parsed.professionalSummary.score, issues: parsed.professionalSummary.issues },
        { name: "ATS Compatibility", score: parsed.atsCompatibility.score, issues: parsed.atsCompatibility.issues },
      ],
    };
  } catch (err) {
    console.error("Groq error status:", err.status);
    console.error("Groq error data:", err.message);
    return {
      category: "Optimization",
      score: 50,
      checks: [
        { name: "Professional Summary", score: 50, issues: ["Could not analyze — AI service unavailable."] },
        { name: "ATS Compatibility", score: 50, issues: ["Could not analyze — AI service unavailable."] },
      ],
    };
  }
};

module.exports = checkOptimization;