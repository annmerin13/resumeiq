require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Groq = require('groq-sdk');

async function main() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  console.log('model:', model);

  try {
    const completion = await groq.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'Return JSON: {"match_score":50,"matched_keywords":[],"missing_skills":[],"recommendations":["test"]}' }],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });
    console.log('OK:', completion.choices[0].message.content);
  } catch (err) {
    console.error('FAIL:', err.status, err.message);
    console.error('detail:', err.error || err);
  }
}

main();
