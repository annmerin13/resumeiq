require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../db');
const resolveResumePath = require('../utils/resolveResumePath');
const extractResumeText = require('../utils/extractResumeText');
const parseLlmJson = require('../utils/parseLlmJson');
const Groq = require('groq-sdk');

async function main() {
  const resumeId = process.argv[2] || 21;
  const row = await pool.query('SELECT * FROM resumes WHERE id = $1', [resumeId]);
  if (!row.rows[0]) {
    console.log('resume not found');
    return;
  }
  const r = row.rows[0];
  console.log('file_path:', r.file_path);
  console.log('extracted_text length:', (r.extracted_text || '').length);

  const resolved = resolveResumePath(r.file_path);
  console.log('resolved path:', resolved, 'exists:', Boolean(resolved));

  let text = r.extracted_text?.trim();
  if (!text && resolved) {
    text = await extractResumeText(resolved);
    console.log('parsed text length:', (text || '').length);
  }

  if (!text) {
    console.log('FAIL: no resume text');
    await pool.end();
    return;
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: `Return JSON only: {"match_score":75,"matched_keywords":["js"],"missing_skills":[],"recommendations":["ok"]}\n\nResume:\n${text.slice(0, 2000)}\n\nJD:\nJavaScript developer` }],
    response_format: { type: 'json_object' },
  });
  const raw = completion.choices[0].message.content;
  console.log('groq raw:', raw.slice(0, 200));
  const analysis = parseLlmJson(raw);
  console.log('parsed:', analysis);

  try {
    const ins = await pool.query(
      `INSERT INTO jd_matches (user_id, resume_id, job_title, company_name, job_description, match_score, matched_keywords, missing_skills, recommendations, raw_analysis)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [r.user_id, resumeId, 'Test', 'Co', 'JS dev', analysis.match_score, '[]', '[]', '[]', raw]
    );
    console.log('insert ok id', ins.rows[0].id);
  } catch (e) {
    console.log('insert FAIL:', e.message, e.code);
  }

  await pool.end();
}

main().catch((e) => {
  console.error('ERR', e);
  process.exit(1);
});
