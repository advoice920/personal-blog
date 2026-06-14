const db = require('../config/db');
const { success, error } = require('../utils/response');
const bcrypt = require('bcryptjs');

const getMe = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, email, username, avatar, bio, role, created_at FROM users WHERE id = ?', [req.userId]);
    if (rows.length === 0) return error(res, 'User not found', 404);
    
    return success(res, rows[0]);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return error(res, 'Failed to fetch user profile');
  }
};

const updateMe = async (req, res) => {
  try {
    const { password, username, avatar, bio } = req.body;
    
    const updates = [];
    const values = [];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
    }
    if (username !== undefined) {
      updates.push('username = ?');
      values.push(username);
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(avatar);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }

    if (updates.length === 0) {
      return error(res, 'Nothing to update', 400);
    }

    values.push(req.userId);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await db.query(sql, values);
    
    return success(res, null, 'Profile updated successfully');
  } catch (err) {
    console.error('Error updating user profile:', err);
    return error(res, 'Failed to update user profile');
  }
};

module.exports = {
  getMe,
  updateMe
};
