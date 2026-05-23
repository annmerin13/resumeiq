function parseLlmJson(raw) {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Empty AI response');
  }

  let text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }

  const parsed = JSON.parse(text);

  if (typeof parsed.match_score !== 'number') {
    throw new Error('Missing match_score in AI response');
  }

  parsed.matched_keywords = Array.isArray(parsed.matched_keywords) ? parsed.matched_keywords : [];
  parsed.missing_skills = Array.isArray(parsed.missing_skills) ? parsed.missing_skills : [];
  parsed.recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];

  return parsed;
}

module.exports = parseLlmJson;
