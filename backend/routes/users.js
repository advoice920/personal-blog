const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/me', verifyToken, userController.getMe);
router.put('/me', verifyToken, userController.updateMe);

module.exports = router;
