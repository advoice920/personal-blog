const db = require('../config/db');
const { success, error, paginate } = require('../utils/response');

const addHistory = async (req, res) => {
  try {
    const userId = req.userId || 1; 
    const { module_name, item_id, title, cover } = req.body;

    if (!module_name || !item_id) {
      return error(res, 'Missing required fields: module_name, item_id', 400);
    }

    const query = `
      INSERT INTO history (user_id, module_name, item_id, title, cover) 
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        created_at = CURRENT_TIMESTAMP,
        title = VALUES(title),
        cover = VALUES(cover)
    `;
    
    await db.query(query, [userId, module_name, item_id, title || '', cover || '']);
    return success(res, null, 'History recorded successfully');
  } catch (err) {
    console.error('Error adding history:', err);
    return error(res, 'Failed to add history');
  }
};

const getHistory = async (req, res) => {
  try {
    const userId = req.userId || 1;
    let { page = 1, limit = 20 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const query = `SELECT * FROM history WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const countQuery = `SELECT COUNT(*) as total FROM history WHERE user_id = ?`;

    const [rows] = await db.query(query, [userId, limit, offset]);
    const [countResult] = await db.query(countQuery, [userId]);
    const total = countResult[0].total;

    return paginate(res, rows, total, page, limit);
  } catch (err) {
    console.error('Error fetching history:', err);
    return error(res, 'Failed to fetch history');
  }
};

const clearHistory = async (req, res) => {
  try {
    const userId = req.userId || 1;
    await db.query(`DELETE FROM history WHERE user_id = ?`, [userId]);
    return success(res, null, 'History cleared successfully');
  } catch (err) {
    console.error('Error clearing history:', err);
    return error(res, 'Failed to clear history');
  }
};

const deleteHistory = async (req, res) => {
  try {
    const userId = req.userId || 1;
    const { id } = req.params;
    await db.query(`DELETE FROM history WHERE id = ? AND user_id = ?`, [id, userId]);
    return success(res, null, 'History deleted successfully');
  } catch (err) {
    console.error('Error deleting history:', err);
    return error(res, 'Failed to delete history');
  }
};

module.exports = {
  addHistory,
  getHistory,
  clearHistory,
  deleteHistory
};
