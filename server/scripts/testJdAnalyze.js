require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');

const API = process.env.API_URL || 'http://localhost:5001';
const email = process.argv[2];
const password = process.argv[3];

async function main() {
  if (!email || !password) {
    console.log('Usage: node scripts/testJdAnalyze.js <email> <password>');
    process.exit(1);
  }

  console.log('GROQ_API_KEY set:', Boolean(process.env.GROQ_API_KEY));

  const login = await axios.post(`${API}/api/auth/login`, { email, password });
  const token = login.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  const resumes = await axios.get(`${API}/api/resume`, { headers });
  const resumeId = resumes.data.find((r) => r.file_name?.endsWith('.docx'))?.id
    || resumes.data.find((r) => r.file_name?.toLowerCase().includes('ann_merin'))?.id
    || resumes.data[0]?.id;
  if (!resumeId) {
    console.log('No resumes for user');
    return;
  }
  console.log('Using resume id:', resumeId);

  try {
    const analyze = await axios.post(
      `${API}/api/jd-match/analyze`,
      {
        resume_id: resumeId,
        job_title: 'Software Engineer',
        company_name: 'Test Co',
        job_description: 'Requirements: JavaScript, React, Node.js, PostgreSQL, REST APIs.',
      },
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    );
    console.log('SUCCESS', analyze.data);
  } catch (err) {
    console.log('FAIL status:', err.response?.status);
    console.log('FAIL body:', err.response?.data);
    console.log('FAIL msg:', err.message);
  }
}

main();
