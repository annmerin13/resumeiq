const express = require('express');
const router = express.Router();
const path = require('path');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const extractResumeText = require('../utils/extractResumeText');
const resolveResumePath = require('../utils/resolveResumePath');

const handleUpload = (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: err.message || 'Invalid file upload.' });
  });
};

// POST /api/resume/upload (protected)
router.post('/upload', authMiddleware, handleUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = path.resolve(req.file.path);

    const newResume = await pool.query(
      'INSERT INTO resumes (user_id, file_name, file_path, extracted_text) VALUES ($1, $2, $3, $4) RETURNING id, user_id, file_name, file_path, extracted_text, created_at',
      [req.user.id, req.file.originalname, filePath, null]
    );

    res.status(201).json({
      message: 'Resume uploaded successfully',
      resume: newResume.rows[0],
    });

    // Parse text in background so upload never hangs on slow PDFs
    extractResumeText(filePath)
      .then((text) => {
        if (!text) return;
        return pool.query(
          'UPDATE resumes SET extracted_text = $1 WHERE id = $2 AND user_id = $3',
          [text, newResume.rows[0].id, req.user.id]
        );
      })
      .catch((err) => console.warn('Background text extraction failed:', err.message));
  } catch (err) {
    console.error('Resume upload error:', err.message);
    if (err.code === '42P01') {
      return res.status(500).json({ message: 'Database not ready. Run: npm run migrate' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/resume (protected)
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
