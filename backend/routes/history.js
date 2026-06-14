const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');

const looseVerifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    req.userId = 1; // Default fallback user for generic history
    return next();
  }
  const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
  jwt.verify(tokenString, JWT_SECRET, (err, decoded) => {
    if (!err) {
      req.userId = decoded.id;
    } else {
      req.userId = 1;
    }
    next();
  });
};

router.post('/', looseVerifyToken, historyController.addHistory);
router.get('/', looseVerifyToken, historyController.getHistory);
router.delete('/', looseVerifyToken, historyController.clearHistory);
router.delete('/:id', looseVerifyToken, historyController.deleteHistory);

module.exports = router;
