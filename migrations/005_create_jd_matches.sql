-- filename: migrations/005_create_jd_matches.sql

CREATE TABLE IF NOT EXISTS jd_matches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id INTEGER REFERENCES resumes(id) ON DELETE SET NULL,
  job_title VARCHAR(255),
  company_name VARCHAR(255),
  job_description TEXT NOT NULL,
  match_score INTEGER NOT NULL,          -- 0-100
  matched_keywords JSONB NOT NULL,       -- ["Python", "SQL", ...]
  missing_skills JSONB NOT NULL,         -- ["Docker", "Kafka", ...]
  recommendations JSONB NOT NULL,        -- ["Add X to experience", ...]
  raw_analysis TEXT,                     -- full AI response
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jd_matches_user_id ON jd_matches(user_id);
CREATE INDEX idx_jd_matches_resume_id ON jd_matches(resume_id);