-- server/db/migrations/create_resume_scores.sql

CREATE TABLE IF NOT EXISTS resume_scores (
  id SERIAL PRIMARY KEY,
  resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  overall_score NUMERIC(5,2),
  format_score JSONB,
  content_score JSONB,
  completeness_score JSONB,
  optimization_score JSONB,
  resume_text TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);