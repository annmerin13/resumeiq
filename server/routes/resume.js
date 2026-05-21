// filename: server/routes/resume.js

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const parseResume = require('../utils/parseResume');
const path = require('path');

// POST /api/resume/upload (protected)
router.post('/upload', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Extract text at upload time
    const filePath = path.resolve(req.file.path);
    let extractedText = null;
    try {
      extractedText = await parseResume(filePath);
    } catch (parseErr) {
      console.warn('Text extraction failed:', parseErr.message);
      // Don't block upload if parsing fails
    }

    const newResume = await pool.query(
      'INSERT INTO resumes (user_id, file_name, file_path, extracted_text) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, req.file.originalname, req.file.path, extractedText]
    );

    res.status(201).json({
      message: 'Resume uploaded successfully',
      resume: newResume.rows[0]
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/resumes (protected)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const resumes = await pool.query(
      'SELECT id, user_id, file_name, file_path, created_at FROM resumes WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.status(200).json(resumes.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/resume/:id (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query(
      'SELECT * FROM resumes WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    await pool.query('DELETE FROM resume_scores WHERE resume_id = $1', [id]);
    await pool.query('DELETE FROM resumes WHERE id = $1', [id]);
    res.status(200).json({ message: 'Resume deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;