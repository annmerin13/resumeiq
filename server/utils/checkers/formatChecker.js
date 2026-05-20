// server/utils/checkers/formatChecker.js

const checkFormat = (text) => {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  const words = text.split(/\s+/).filter(Boolean);
  const bullets = lines.filter((l) => /^[•\-\*\u2022]/.test(l.trim()));

  // 1. Word Count (ideal: 400–800)
  const wordCount = words.length;
  let wordCountScore = 100;
  let wordCountIssues = [];
  if (wordCount < 300) {
    wordCountScore = 30;
    wordCountIssues.push(`Only ${wordCount} words. Aim for 400–800.`);
  } else if (wordCount > 900) {
    wordCountScore = 60;
    wordCountIssues.push(`${wordCount} words is too long. Keep under 800.`);
  }

  // 2. Document Length (ideal: ~1 page = 500–800 words)
  let docLengthScore = 100;
  let docLengthIssues = [];
  if (wordCount < 300) {
    docLengthScore = 40;
    docLengthIssues.push("Resume appears too short for a full page.");
  } else if (wordCount > 1000) {
    docLengthScore = 60;
    docLengthIssues.push("Resume may exceed 1 page. Consider trimming.");
  }

  // 3. Bullet Point Length (ideal: each bullet < 20 words)
  const longBullets = bullets.filter((b) => b.split(/\s+/).length > 20);
  const bulletLengthScore = bullets.length === 0 ? 50 : Math.max(0, 100 - Math.round((longBullets.length / bullets.length) * 100));
  const bulletLengthIssues = longBullets.length > 0
    ? [`${longBullets.length} bullet(s) exceed 20 words. Be more concise.`]
    : [];

  // 4. Bullet Point Count (ideal: 2–5 per section)
  let bulletCountScore = 100;
  let bulletCountIssues = [];
  if (bullets.length < 3) {
    bulletCountScore = 40;
    bulletCountIssues.push("Too few bullet points. Add more detail to experience.");
  } else if (bullets.length > 25) {
    bulletCountScore = 60;
    bulletCountIssues.push("Too many bullet points overall. Trim to essentials.");
  }

  // 5. Date Format Consistency
  const datePatterns = [
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b/g,
    /\b\d{2}\/\d{4}\b/g,
    /\b\d{4}\s*[-–]\s*\d{4}\b/g,
  ];
  const matchCounts = datePatterns.map((p) => (text.match(p) || []).length);
  const totalDates = matchCounts.reduce((a, b) => a + b, 0);
  const dominantFormat = Math.max(...matchCounts);
  const dateConsistencyScore = totalDates === 0 ? 50 : Math.round((dominantFormat / totalDates) * 100);
  const dateConsistencyIssues = dateConsistencyScore < 100
    ? ["Mixed date formats detected. Use one consistent format (e.g. Jan 2024)."]
    : [];

  // 6. Section Order (ideal: Summary → Education → Experience → Skills)
  const sectionKeywords = ["summary", "education", "experience", "skills"];
  const sectionPositions = sectionKeywords.map((kw) => {
    const idx = text.toLowerCase().indexOf(kw);
    return { kw, idx };
  }).filter((s) => s.idx !== -1);
  const isOrdered = sectionPositions.every((s, i) =>
    i === 0 || s.idx > sectionPositions[i - 1].idx
  );
  const sectionOrderScore = isOrdered ? 100 : 60;
  const sectionOrderIssues = !isOrdered
    ? ["Section order seems off. Recommended: Summary → Education → Experience → Skills."]
    : [];

  // 7. Formatting Consistency (check inconsistent capitalization in section headers)
  const headerCandidates = lines.filter((l) => l.trim().length < 30 && l.trim().length > 2);
  const allCaps = headerCandidates.filter((l) => l.trim() === l.trim().toUpperCase());
  const titleCase = headerCandidates.filter((l) => /^[A-Z][a-z]/.test(l.trim()));
  const dominant = Math.max(allCaps.length, titleCase.length);
  const formattingConsistencyScore = headerCandidates.length === 0 ? 100
    : Math.round((dominant / headerCandidates.length) * 100);
  const formattingConsistencyIssues = formattingConsistencyScore < 80
    ? ["Inconsistent header capitalization. Pick ALL CAPS or Title Case and stick with it."]
    : [];

  const categoryScore = Math.round(
    (wordCountScore + docLengthScore + bulletLengthScore + bulletCountScore +
      dateConsistencyScore + sectionOrderScore + formattingConsistencyScore) / 7
  );

  return {
    category: "Format",
    score: categoryScore,
    checks: [
      { name: "Document Length", score: docLengthScore, issues: docLengthIssues },
      { name: "Word Count", score: wordCountScore, issues: wordCountIssues },
      { name: "Bullet Point Length", score: bulletLengthScore, issues: bulletLengthIssues },
      { name: "Bullet Point Count", score: bulletCountScore, issues: bulletCountIssues },
      { name: "Date Format Consistency", score: dateConsistencyScore, issues: dateConsistencyIssues },
      { name: "Section Order", score: sectionOrderScore, issues: sectionOrderIssues },
      { name: "Formatting Consistency", score: formattingConsistencyScore, issues: formattingConsistencyIssues },
    ],
  };
};

module.exports = checkFormat;