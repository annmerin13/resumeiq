const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const authenticateToken = require('../middleware/authMiddleware');
const extractResumeText = require('../utils/extractResumeText');
const resolveResumePath = require('../utils/resolveResumePath');
const parseLlmJson = require('../utils/parseLlmJson');
const pool = require('../db');

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

function buildPrompt(resumeText, jobDescription) {
  return `You are an ATS and recruitment expert. Analyze how well this resume matches the job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

OUTPUT RULES:
- Return ONLY valid JSON, no markdown, no explanation, no backticks
- Be strict and realistic with match_score
- JSON structure must be exactly:
{
  "match_score": <integer 0-100>,
  "matched_keywords": ["keyword1", "keyword2"],
  "missing_skills": ["skill1", "skill2"],
  "recommendations": ["specific actionable suggestion 1", "specific actionable suggestion 2"]
}`;
}

async function getResumeText(extractedText, filePath) {
  if (extractedText && extractedText.trim()) {
    return extractedText.trim();
  }

  const resolvedPath = resolveResumePath(filePath);
  if (!resolvedPath) {
    return null;
  }

  const text = await extractResumeText(resolvedPath);
  if (text && text.trim()) {
    return text.trim();
  }

  return null;
}

router.post('/analyze', authenticateToken, async (req, res) => {
  const { resume_id, job_title, company_name, job_description } = req.body;

  if (!resume_id || !job_description?.trim()) {
    return res.status(400).json({ error: 'resume_id and job_description are required.' });
  }

  const groq = getGroqClient();
  if (!groq) {
    return res.status(503).json({
      error: 'AI is not configured. Add GROQ_API_KEY to your server .env file.',
    });
  }

  try {
    const resumeResult = await pool.query(
      'SELECT extracted_text, file_path FROM resumes WHERE id = $1 AND user_id = $2',
      [resume_id, req.user.id]
    );

    if (resumeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found.' });
    }

    const { extracted_text, file_path } = resumeResult.rows[0];
    const resumeText = await getResumeText(extracted_text, file_path);

    if (!resumeText) {
      return res.status(400).json({
        error: 'Could not read text from this resume. Try re-uploading as PDF or DOCX.',
      });
    }

    const prompt = buildPrompt(resumeText, job_description.trim());

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return res.status(500).json({ error: 'AI returned an empty response. Try again.' });
    }

    let analysis;
    try {
      analysis = parseLlmJson(raw);
    } catch (parseErr) {
      console.error('JD JSON parse error:', parseErr.message, raw.slice(0, 200));
      return res.status(500).json({ error: 'AI returned invalid JSON. Try again.' });
    }

    const result = await pool.query(
      `INSERT INTO jd_matches
        (user_id, resume_id, job_title, company_name, job_description, match_score, matched_keywords, missing_skills, recommendations, raw_analysis)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, match_score, created_at`,
      [
        req.user.id,
        resume_id,
        job_title || null,
        company_name || null,
        job_description.trim(),
        analysis.match_score,
        JSON.stringify(analysis.matched_keywords),
        JSON.stringify(analysis.missing_skills),
        JSON.stringify(analysis.recommendations),
        raw,
      ]
    );

    res.status(201).json({
      message: 'Analysis complete',
      match: {
        id: result.rows[0].id,
        match_score: result.rows[0].match_score,
        created_at: result.rows[0].created_at,
        matched_keywords: analysis.matched_keywords,
        missing_skills: analysis.missing_skills,
        recommendations: analysis.recommendations,
      },
    });
  } catch (err) {
    console.error('JD match error:', err);

    const groqMsg = err?.error?.message || err?.message || '';
    if (groqMsg.includes('api_key') || groqMsg.includes('API key')) {
      return res.status(503).json({ error: 'Invalid GROQ_API_KEY. Check your server .env file.' });
    }
    if (groqMsg.includes('decommissioned') || groqMsg.includes('model')) {
      return res.status(502).json({
        error: `AI model error: ${groqMsg}. Set GROQ_MODEL in .env (e.g. llama-3.3-70b-versatile).`,
      });
    }
    if (err.code === '42P01') {
      return res.status(500).json({ error: 'Database not ready. Run: npm run migrate' });
    }

    res.status(500).json({
      error: groqMsg || 'Failed to analyze match.',
    });
  }
});

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, job_title, company_name, match_score, created_at
       FROM jd_matches
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ matches: result.rows });
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM jd_matches WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    res.json({ match: result.rows[0] });
  } catch (err) {
    console.error('Match fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch match.' });
  }
});

module.exports = router;
