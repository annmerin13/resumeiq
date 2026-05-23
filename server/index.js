// server/index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const resumeRoutes = require('./routes/resume');
app.use('/api/resume', resumeRoutes);

const scoreRoutes = require('./routes/scores');
app.use('/api/scores', scoreRoutes);

const jdMatchRoutes = require('./routes/jdMatch');
app.use('/api/jd-match', jdMatchRoutes);

app.get('/', (req, res) => res.send('ResumeIQ API is running ✅'));
app.get('/api/test', (req, res) => res.json({ message: 'API is working ✅' }));


app.get('/api/debug-user', async (req, res) => {
  const pool = require('./db');
  const users = await pool.query('SELECT id, email FROM users');
  res.json(users.rows);
});




const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Start server immediately, don't wait for DB
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000} ✅`);
});

// DB + migrations in background
const sequelize = require('./config/db');
const runMigrationsOnBoot = require('./utils/runMigrationsOnBoot');
sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL connected ✅');
    return runMigrationsOnBoot();
  })
  .catch((err) => console.log('DB Connection Error:', err));