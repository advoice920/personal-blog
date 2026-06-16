const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return error(res, 'No token provided', 403);
  }

  const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;

  jwt.verify(tokenString, JWT_SECRET, (err, decoded) => {
    if (err) {
      return error(res, 'Failed to authenticate token', 401);
    }
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return error(res, 'Requires admin privileges', 403);
  }
  next();
};

module.exports = {
  verifyToken,
  isAdmin
};
