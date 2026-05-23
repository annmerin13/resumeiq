// server/routes/jdMatch.js
const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const authMiddleware = require('../middleware/authMiddleware');
const extractResumeText = require('../utils/extractResumeText');
const resolveResumePath = require('../utils/resolveResumePath');
const parseLlmJson = require('../utils/parseLlmJson');
const pool = require('../db');

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { resume_id, job_title, company_name, job_description } = req.body;

    if (!resume_id || !job_description?.trim()) {
      return res.status(400).json({ error: 'resume_id and job_description are required.' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'AI not configured. Add GROQ_API_KEY to .env' });
    }

    const resumeResult = await pool.query(
      'SELECT extracted_text, file_path FROM resumes WHERE id = $1 AND user_id = $2',
      [resume_id, req.user.id]
    );

    if (resumeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Resume not found.' });
    }

    const { extracted_text, file_path } = resumeResult.rows[0];
    let resumeText = extracted_text?.trim();

    if (!resumeText) {
      const resolved = resolveResumePath(file_path);
      if (resolved) resumeText = await extractResumeText(resolved);
    }

    if (!resumeText) {
      return res.status(400).json({ error: 'Could not read resume text. Re-upload the file.' });
    }

    const groq = new Groq({ apiKey });
    const prompt = `You are an ATS expert. Analyze how well this resume matches the job description.

RESUME:
${resumeText.slice(0, 3000)}

JOB DESCRIPTION:
${job_description.trim().slice(0, 2000)}

Return ONLY valid JSON, no markdown:
{
  "match_score": <integer 0-100>,
  "matched_keywords": ["keyword1", "keyword2"],
  "missing_skills": ["skill1", "skill2"],
  "recommendations": ["suggestion1", "suggestion2"]
}`;

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return res.status(500).json({ error: 'AI returned empty response.' });

    const analysis = parseLlmJson(raw);

    const result = await pool.query(
      `INSERT INTO jd_matches
        (user_id, resume_id, job_title, company_name, job_description, match_score, matched_keywords, missing_skills, recommendations, raw_analysis)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, match_score, created_at`,
      [
        req.user.id, resume_id,
        job_title || null, company_name || null,
        job_description.trim(),
        analysis.match_score,
        JSON.stringify(analysis.matched_keywords),
        JSON.stringify(analysis.missing_skills),
        JSON.stringify(analysis.recommendations),
        raw,
      ]
    );

    return res.status(201).json({
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
    return res.status(500).json({ error: err.message || 'Failed to analyze match.' });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, job_title, company_name, match_score, created_at
       FROM jd_matches WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ matches: result.rows });
  } catch (err) {
    console.error('History error:', err);
    return res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM jd_matches WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Match not found.' });
    return res.json({ match: result.rows[0] });
  } catch (err) {
    console.error('Match fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch match.' });
  }
});

module.exports = router;