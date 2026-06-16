const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/send-code', authController.sendCode);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
