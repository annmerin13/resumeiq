require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const pool = require('../db');

const ordered = [
  path.join(__dirname, '..', 'db', 'init.sql'),
  path.join(__dirname, '..', 'db', 'migrations', 'create_resumes.sql'),
  path.join(__dirname, '..', 'db', 'migrations', 'add_extracted_text.sql'),
  path.join(__dirname, '..', 'db', 'migrations', 'create_resume_scores.sql'),
  path.join(__dirname, '..', 'db', 'migrations', 'add_unique_resume_scores.sql'),
  path.join(__dirname, '..', '..', 'migrations', '005_create_jd_matches.sql'),
];

async function run() {
  for (const file of ordered) {
    if (!fs.existsSync(file)) {
      console.log('Skip (missing):', path.basename(file));
      continue;
    }
    const sql = fs.readFileSync(file, 'utf8');
    console.log('Running', path.basename(file));
    try {
      await pool.query(sql);
    } catch (err) {
      if (err.code === '42P07' || err.code === '42710') {
        console.log('  Already applied:', err.message);
        continue;
      }
      throw err;
    }
  }
  console.log('Migrations complete.');
  await pool.end();
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
