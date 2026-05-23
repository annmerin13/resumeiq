const fs = require('fs');
const path = require('path');
const pool = require('../db');

const migrationFiles = [
  path.join(__dirname, '..', 'db', 'init.sql'),
  path.join(__dirname, '..', 'db', 'migrations', 'create_resumes.sql'),
  path.join(__dirname, '..', 'db', 'migrations', 'add_extracted_text.sql'),
  path.join(__dirname, '..', 'db', 'migrations', 'create_resume_scores.sql'),
  path.join(__dirname, '..', 'db', 'migrations', 'add_unique_resume_scores.sql'),
  path.join(__dirname, '..', '..', 'migrations', '005_create_jd_matches.sql'),
];

async function runMigrationsOnBoot() {
  for (const file of migrationFiles) {
    if (!fs.existsSync(file)) continue;
    const sql = fs.readFileSync(file, 'utf8');
    try {
      await pool.query(sql);
    } catch (err) {
      if (err.code === '42P07' || err.code === '42710') continue;
      throw err;
    }
  }
}

module.exports = runMigrationsOnBoot;
