// server/utils/scoreResume.js

const parseResume = require("./parseResume");
const checkFormat = require("./checkers/formatChecker");
const checkContent = require("./checkers/contentChecker");
const checkCompleteness = require("./checkers/completenessChecker");
const checkOptimization = require("./checkers/optimizationChecker");

const scoreResume = async (filePath) => {
  const text = await parseResume(filePath);

  const [format, content, completeness, optimization] = await Promise.all([
    checkFormat(text),
    checkContent(text),
    checkCompleteness(text),
    checkOptimization(text),
  ]);

  const overallScore = parseFloat(
    ((format.score + content.score + completeness.score + optimization.score) / 4).toFixed(2)
  );

  return {
    overallScore,
    resumeText: text,
    categories: { format, content, completeness, optimization },
  };
};

module.exports = scoreResume;