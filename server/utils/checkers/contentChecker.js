// server/utils/checkers/contentChecker.js

const checkContent = (text) => {
  const lines = text.split("\n").filter((l) => l.trim());
  const bullets = lines.filter((l) => /^[•\-\*\u2022]/.test(l.trim()));
  const lower = text.toLowerCase();

  // 1. Quantifiable Achievements
  const quantPattern = /\d+\s*(%|percent|x|times|users|clients|projects|hours|days|weeks|\$|million|thousand|k\b)/gi;
  const quantMatches = text.match(quantPattern) || [];
  const expectedQuant = Math.max(bullets.length, 3);
  const quantScore = Math.min(100, Math.round((quantMatches.length / expectedQuant) * 100));
  const quantIssues = quantMatches.length < 3
    ? [`Only ${quantMatches.length} quantified achievement(s) found. Add numbers to show impact (e.g. "Improved load time by 40%").`]
    : [];

  // 2. Action Verbs
  const strongVerbs = ["led","built","developed","designed","implemented","optimized","reduced","increased","launched","created","managed","delivered","automated","improved","architected","engineered","deployed","migrated","integrated","mentored"];
  const weakVerbs = ["helped","assisted","worked","involved","participated","contributed","supported","handled","did","used"];
  const foundStrong = strongVerbs.filter((v) => lower.includes(v));
  const foundWeak = weakVerbs.filter((v) => lower.includes(v));
  const actionVerbScore = Math.min(100, Math.round((foundStrong.length / Math.max(bullets.length, 5)) * 100) - foundWeak.length * 10);
  const actionVerbIssues = foundWeak.length > 0
    ? [`Weak verbs found: "${foundWeak.join('", "')}". Replace with strong action verbs.`]
    : [];

  // 3. Personal Pronouns
  const pronounPattern = /\b(I|me|my|myself|we|our)\b/g;
  const pronounMatches = text.match(pronounPattern) || [];
  const pronounScore = pronounMatches.length === 0 ? 100 : 0;
  const pronounIssues = pronounMatches.length > 0
    ? [`Found ${pronounMatches.length} personal pronoun(s): "${[...new Set(pronounMatches)].join('", "')}". Remove all — resumes use implied subject.`]
    : [];

  // 4. Duplicated Action Verbs
  const verbCounts = {};
  strongVerbs.forEach((v) => {
    const regex = new RegExp(`\\b${v}\\b`, "gi");
    const count = (text.match(regex) || []).length;
    if (count > 0) verbCounts[v] = count;
  });
  const duplicated = Object.entries(verbCounts).filter(([, count]) => count >= 3);
  const dupScore = duplicated.length === 0 ? 100 : Math.max(0, 100 - duplicated.length * 20);
  const dupIssues = duplicated.map(([v, c]) => `"${v}" used ${c} times. Vary your action verbs.`);

  // 5. Filler Words
  const fillerWords = ["responsible for","in charge of","worked on","involved in","helped with","duties included","tasks included","assisted with"];
  const foundFillers = fillerWords.filter((f) => lower.includes(f));
  const fillerScore = foundFillers.length === 0 ? 100 : Math.max(0, 100 - foundFillers.length * 25);
  const fillerIssues = foundFillers.length > 0
    ? [`Filler phrases found: "${foundFillers.join('", "')}". Start bullets directly with action verbs.`]
    : [];

  const categoryScore = Math.round(
    (quantScore + Math.max(0, actionVerbScore) + pronounScore + dupScore + fillerScore) / 5
  );

  return {
    category: "Content",
    score: categoryScore,
    checks: [
      { name: "Quantifiable Achievements Check", score: quantScore, issues: quantIssues },
      { name: "Action Verbs Check", score: Math.max(0, actionVerbScore), issues: actionVerbIssues },
      { name: "Personal Pronouns Check", score: pronounScore, issues: pronounIssues },
      { name: "Duplicated Action Verbs Check", score: dupScore, issues: dupIssues },
      { name: "Filler Words Check", score: fillerScore, issues: fillerIssues },
    ],
  };
};

module.exports = checkContent;