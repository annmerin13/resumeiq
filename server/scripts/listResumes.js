require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = require('../db');

(async () => {
  const cols = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = 'resumes' ORDER BY ordinal_position`
  );
  console.log('columns:', cols.rows.map((r) => r.column_name).join(', '));

  const rows = await pool.query(
    'SELECT id, file_name, file_path FROM resumes ORDER BY id DESC LIMIT 10'
  );
  console.table(rows.rows);
  await pool.end();
})();
