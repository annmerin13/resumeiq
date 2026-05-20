// server/utils/checkers/completenessChecker.js

const checkCompleteness = (text) => {
  const lower = text.toLowerCase();
  const lines = text.split("\n").filter((l) => l.trim());

  // 1. Required Sections
  const requiredSections = ["education", "experience", "skills"];
  const optionalSections = ["summary", "projects", "certifications"];
  const foundRequired = requiredSections.filter((s) => lower.includes(s));
  const foundOptional = optionalSections.filter((s) => lower.includes(s));
  const requiredScore = Math.round((foundRequired.length / requiredSections.length) * 100);
  const requiredIssues = requiredSections
    .filter((s) => !lower.includes(s))
    .map((s) => `Missing section: "${s.charAt(0).toUpperCase() + s.slice(1)}"`);

  // 2. Date Presence
  const experienceBlock = text.substring(lower.indexOf("experience"), lower.indexOf("skills") > 0 ? lower.indexOf("skills") : text.length);
  const dateRegex = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\b/g;
  const datesFound = (experienceBlock.match(dateRegex) || []).length;
  const dateScore = datesFound >= 2 ? 100 : datesFound === 1 ? 50 : 16;
  const dateIssues = datesFound < 2 ? ["Some experience entries appear to be missing dates."] : [];

  // 3. Contact Info
  const hasEmail = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(text);
  const hasPhone = /(\+?\d[\d\s\-().]{7,}\d)/.test(text);
  const hasLinkedIn = /linkedin\.com\/in\//i.test(text);
  const contactFields = [hasEmail, hasPhone, hasLinkedIn];
  const contactScore = Math.round((contactFields.filter(Boolean).length / contactFields.length) * 100);
  const contactIssues = [
    !hasEmail && "Missing email address.",
    !hasPhone && "Missing phone number.",
    !hasLinkedIn && "Missing LinkedIn URL.",
  ].filter(Boolean);

  // 4. Experience Completeness
  const jobTitlePattern = /\b(engineer|developer|intern|analyst|manager|designer|lead|consultant)\b/i;
  const companyPattern = /\b(inc|ltd|llc|technologies|solutions|systems|pvt)\b/i;
  const hasJobTitles = jobTitlePattern.test(text);
  const hasCompanyNames = companyPattern.test(text);
  const hasBullets = /^[•\-\*]/m.test(text);
  const expFields = [hasJobTitles, hasCompanyNames, hasBullets, datesFound >= 2];
  const expScore = Math.round((expFields.filter(Boolean).length / expFields.length) * 100);
  const expIssues = [
    !hasJobTitles && "Job titles not clearly detected.",
    !hasBullets && "No bullet points found under experience.",
    datesFound < 2 && "Experience entries missing dates.",
  ].filter(Boolean);

  // 5. Skills Quality
  const genericSkills = ["ms word", "microsoft office", "ms excel", "powerpoint", "internet browsing", "email"];
  const foundGeneric = genericSkills.filter((s) => lower.includes(s));
  const skillsSection = text.substring(lower.indexOf("skills"), lower.indexOf("skills") + 500);
  const skillWords = skillsSection.split(/[\n,]+/).filter((s) => s.trim().length > 2);
  const skillsScore = skillWords.length < 5 ? 40 : foundGeneric.length > 2 ? 50 : 85;
  const skillsIssues = [
    foundGeneric.length > 0 && `Generic skills detected: ${foundGeneric.join(", ")}. Replace with technical skills.`,
    skillWords.length < 5 && "Skills section appears thin. Add more relevant skills.",
  ].filter(Boolean);

  const categoryScore = Math.round(
    (requiredScore + dateScore + contactScore + expScore + skillsScore) / 5
  );

  return {
    category: "Completeness",
    score: categoryScore,
    checks: [
      { name: "Required Sections", score: requiredScore, issues: requiredIssues },
      { name: "Date Presence And Format", score: dateScore, issues: dateIssues },
      { name: "Contact Info", score: contactScore, issues: contactIssues },
      { name: "Experience Completeness", score: expScore, issues: expIssues },
      { name: "Skills Quality", score: skillsScore, issues: skillsIssues },
    ],
  };
};

module.exports = checkCompleteness;