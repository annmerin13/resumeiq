const parseResume = require('./parseResume');

const PARSE_TIMEOUT_MS = 15000;

async function extractResumeText(filePath) {
  try {
    const text = await Promise.race([
      parseResume(filePath),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Resume text extraction timed out')), PARSE_TIMEOUT_MS);
      }),
    ]);
    return text || null;
  } catch (err) {
    console.warn('Text extraction failed:', err.message);
    return null;
  }
}

module.exports = extractResumeText;
