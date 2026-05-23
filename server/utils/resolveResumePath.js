const path = require('path');
const fs = require('fs');

function resolveResumePath(storedPath) {
  if (!storedPath) return null;

  const normalized = storedPath.replace(/\\/g, '/');
  const basename = path.basename(normalized);

  const candidates = [
    storedPath,
    normalized,
    path.isAbsolute(storedPath) ? null : path.join(__dirname, '..', normalized),
    path.isAbsolute(storedPath) ? null : path.join(__dirname, '..', 'uploads', basename),
    path.isAbsolute(storedPath) ? null : path.join(process.cwd(), normalized),
    path.isAbsolute(storedPath) ? null : path.join(process.cwd(), 'server', normalized),
    path.isAbsolute(storedPath) ? null : path.join(process.cwd(), 'uploads', basename),
    path.isAbsolute(storedPath) ? null : path.join(process.cwd(), 'server', 'uploads', basename),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return path.resolve(candidate);
  }

  return null;
}

module.exports = resolveResumePath;
