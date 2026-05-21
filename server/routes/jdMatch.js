// filename: server/routes/jdMatch.js

const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const path = require('path');
const authenticateToken = require('../middleware/authMiddleware');
const parseResume = require('../utils/parseResume');
const pool = require('../db'); // ← use shared pool

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


// ── Prompt builder ──────────────────────────────────────────────
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

// ── POST /api/jd-match/analyze ──────────────────────────────────
router.post('/analyze', authenticateToken, async (req, res) => {
  const { resume_id, job_title, company_name, job_description } = req.body;

  if (!resume_id || !job_description) {
    return res.status(400).json({ error: 'resume_id and job_description are required.' });
  }

  try {
    const resumeResult = await pool.query(
      `SELECT extracted_text, file_path FROM resumes WHERE id = $1 AND user_id = $2`,
      [resume_id, req.user.id]
    );

    if (resumeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found.' });
    }

    const { extracted_text, file_path } = resumeResult.rows[0];

    // Fallback: parse from file if extracted_text is null
    let resumeText = extracted_text;
    if (!resumeText) {
      try {
        resumeText = await parseResume(path.resolve(file_path));
      } catch (parseErr) {
        return res.status(400).json({ error: 'Could not extract text from resume file.' });
      }
    }

    const prompt = buildPrompt(resumeText, job_description);

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const raw = completion.choices[0].message.content.trim();

    let analysis;
    try {
      analysis = JSON.parse(raw);
    } catch {
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
        job_description,
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
    res.status(500).json({ error: 'Failed to analyze match.' });
  }
});

// ── GET /api/jd-match/history ───────────────────────────────────
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

// ── GET /api/jd-match/:id ───────────────────────────────────────
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM jd_matches WHERE id = $1 AND user_id = $2`,
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