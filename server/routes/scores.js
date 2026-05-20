// server/routes/scores.js

const express = require("express");
const router = express.Router();
const path = require("path");
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const scoreResume = require("../utils/scoreResume");

// POST /api/scores/analyze/:resumeId
router.post("/analyze/:resumeId", authMiddleware, async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user.id;

  try {
    // Fetch resume record
    const resumeResult = await db.query(
      "SELECT * FROM resumes WHERE id = $1 AND user_id = $2",
      [resumeId, userId]
    );

    if (resumeResult.rows.length === 0) {
      return res.status(404).json({ error: "Resume not found." });
    }

    const resume = resumeResult.rows[0];
    const filePath = path.resolve(resume.file_path);

    // Run scoring
    const { overallScore, resumeText, categories } = await scoreResume(filePath);

    // Upsert score (one score record per resume)
    await db.query(
      `INSERT INTO resume_scores (resume_id, user_id, overall_score, format_score, content_score, completeness_score, optimization_score, resume_text, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (resume_id) DO UPDATE SET
         overall_score = EXCLUDED.overall_score,
         format_score = EXCLUDED.format_score,
         content_score = EXCLUDED.content_score,
         completeness_score = EXCLUDED.completeness_score,
         optimization_score = EXCLUDED.optimization_score,
         resume_text = EXCLUDED.resume_text,
         updated_at = NOW()`,
      [resumeId, userId, overallScore,
        JSON.stringify(categories.format),
        JSON.stringify(categories.content),
        JSON.stringify(categories.completeness),
        JSON.stringify(categories.optimization),
        resumeText]
    );

    res.json({ success: true, overallScore, categories });
  } catch (err) {
    console.error("Score analysis error:", err.message);
    res.status(500).json({ error: "Failed to analyze resume." });
  }
});

// GET /api/scores/:resumeId
router.get("/:resumeId", authMiddleware, async (req, res) => {
  const { resumeId } = req.params;
  const userId = req.user.id;

  try {
    const result = await db.query(
      "SELECT * FROM resume_scores WHERE resume_id = $1 AND user_id = $2",
      [resumeId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No score found for this resume." });
    }

    const row = result.rows[0];
    const parse = (val) => {
      if (typeof val === 'string') { try { return JSON.parse(val); } catch { return val; } }
      return val;
    };
    res.json({
      overallScore: row.overall_score,
      categories: {
        format: parse(row.format_score),
        content: parse(row.content_score),
        completeness: parse(row.completeness_score),
        optimization: parse(row.optimization_score),
      },
    });
  } catch (err) {
    console.error("Fetch score error:", err.message);
    res.status(500).json({ error: "Failed to fetch score." });
  }
});

module.exports = router;