const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');
const { verifyToken } = require('../middleware/authMiddleware');

// Comments
router.get('/comments/:module/:itemId', interactionController.getComments);
router.post('/comments', verifyToken, interactionController.addComment);
router.delete('/comments/:id', verifyToken, interactionController.deleteComment);

// Likes
// getLikes can optionally use verifyToken if we want to know if the current user liked it.
// To make it optional, we can wrap the middleware or just pass verifyToken and require login.
// For simplicity, we require login to check userLike status or use a loose verify token middleware.
const looseVerifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return next();
  const tokenString = token.startsWith('Bearer ') ? token.slice(7) : token;
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
  jwt.verify(tokenString, JWT_SECRET, (err, decoded) => {
    if (!err) {
      req.userId = decoded.id;
      req.userRole = decoded.role;
    }
    next();
  });
};

router.get('/likes/:module/:itemId', looseVerifyToken, interactionController.getLikes);
router.post('/like', verifyToken, interactionController.toggleLike);

module.exports = router;
