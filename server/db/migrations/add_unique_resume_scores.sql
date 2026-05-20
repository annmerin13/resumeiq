-- server/db/migrations/add_unique_resume_scores.sql

ALTER TABLE resume_scores ADD CONSTRAINT unique_resume_score UNIQUE (resume_id);