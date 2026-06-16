const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailUtil = require('../utils/email');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

// Store codes in memory for now. In production, use Redis.
// format: { 'email@example.com': { code: '123456', expiresAt: 1234567890 } }
const verificationCodes = {};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, email]);
    if (users.length === 0) {
      return res.status(401).json({ error: '账号或密码错误' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: '账号或密码错误' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.sendCode = async (req, res) => {
  const { email, type } = req.body;
  if (!email) {
    return res.status(400).json({ error: '请输入邮箱' });
  }

  // For password reset, verify the email belongs to an existing user
  if (type === 'reset') {
    try {
      const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length === 0) {
        return res.status(404).json({ error: '该邮箱未注册' });
      }
    } catch (err) {
      console.error('Check email error:', err);
      return res.status(500).json({ error: '服务器错误' });
    }
  }

  // For registration, check that email is not already registered
  if (!type || type === 'register') {
    try {
      const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length > 0) {
        return res.status(409).json({ error: '该邮箱已被注册' });
      }
    } catch (err) {
      console.error('Check email error:', err);
      return res.status(500).json({ error: '服务器错误' });
    }
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  verificationCodes[email] = { code, expiresAt };

  // const subject = type === 'reset' ? '【LiveBlog】密码重置验证码' : '【LiveBlog】您的注册验证码';
  // const success = await emailUtil.sendVerificationCode(email, code, subject);
  // if (success) {
  //   res.json({ message: '验证码发送成功' });
  // } else {
  //   // Clean up if failed
  //   delete verificationCodes[email];
  //   res.status(500).json({ error: '发送失败，请检查邮箱地址或稍后再试' });
  // }
  const subject = type === 'reset' ? '【LiveBlog】密码重置验证码' : '【LiveBlog】您的注册验证码';
const success = await emailUtil.sendVerificationCode(email, code, subject);
// 新增打印，看 true / false
console.log('邮件发送返回值 success =', success, '目标邮箱：', email);
if (success) {
  res.json({ message: '验证码发送成功' });
} else {
  delete verificationCodes[email];
  res.status(500).json({ error: '发送失败，请检查邮箱地址或稍后再试' });
}
};

exports.register = async (req, res) => {
  const { username, email, password, code } = req.body;
  if (!username || !email || !password || !code) {
    return res.status(400).json({ error: '请填写用户名、邮箱、密码和验证码' });
  }

  const storedData = verificationCodes[email];
  if (!storedData) {
    return res.status(400).json({ error: '请先获取验证码' });
  }
  if (Date.now() > storedData.expiresAt) {
    delete verificationCodes[email];
    return res.status(400).json({ error: '验证码已过期，请重新获取' });
  }
  if (storedData.code !== code) {
    return res.status(400).json({ error: '验证码不正确' });
  }

  try {
    const [existing] = await db.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existing.length > 0) {
      if (existing.find(u => u.email === email)) {
        return res.status(409).json({ error: '该邮箱已被注册' });
      }
      return res.status(409).json({ error: '该用户名已被使用' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);
    
    // Clear code after successful registration
    delete verificationCodes[email];

    res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: '请填写邮箱、验证码和新密码' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: '新密码长度不能少于6位' });
  }

  // Verify the code
  const storedData = verificationCodes[email];
  if (!storedData) {
    return res.status(400).json({ error: '请先获取验证码' });
  }
  if (Date.now() > storedData.expiresAt) {
    delete verificationCodes[email];
    return res.status(400).json({ error: '验证码已过期，请重新获取' });
  }
  if (storedData.code !== code) {
    return res.status(400).json({ error: '验证码不正确' });
  }

  try {
    // Verify user exists
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ error: '该邮箱未注册' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

    // Clear code after successful reset
    delete verificationCodes[email];

    res.json({ message: '密码重置成功' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
};