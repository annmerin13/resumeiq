const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // 1. Get token from request header
  const token = req.header('Authorization');

  // 2. Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, access denied' });
  }

  try {
    // 3. Verify token
    const decoded = jwt.verify(
      token.replace('Bearer ', ''),
      process.env.JWT_SECRET || 'mysecretkey'
    );

    // 4. Attach user info to request
    req.user = decoded;
    next();

  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;