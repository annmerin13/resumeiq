const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sequelize = require('./config/db');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const resumeRoutes = require('./routes/resume');
app.use('/api/resume', resumeRoutes);

const scoreRoutes = require("./routes/scores");
app.use("/api/scores", scoreRoutes);

const path = require('path');
// Serve uploads folder as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Test route
app.get('/', (req, res) => {
  res.send('ResumeIQ API is running ✅');
});
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working ✅', project: 'ResumeIQ' })
})
// Connect to PostgreSQL
sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL connected ✅');
    return sequelize.sync();
  })
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT} ✅`);
    });
  })
    .catch((err) => console.log('DB Connection Error:', err));
  


