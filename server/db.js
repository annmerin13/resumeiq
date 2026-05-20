const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',        // your PostgreSQL username
  host: 'localhost',
  database: 'resumeiq',   // your DB name
  password: 'car', // your PostgreSQL password
  port: 5432,
});

module.exports = pool;