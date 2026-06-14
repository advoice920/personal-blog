const db = require('../config/db');
const { success, error } = require('../utils/response');

const searchAll = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return success(res, []);
    }

    const searchPattern = `%${q}%`;
    const modules = ['articles', 'food', 'travel', 'photo', 'reading', 'music', 'movie', 'fashion'];
    
    // Perform parallel searches across all tables
    const searchPromises = modules.map(async (mod) => {
      // Basic text fields across different tables
      // Some have 'title' and 'summary', some have 'title' and 'desc', some 'title' and 'text'
      let query = `SELECT id, title, created_at, '${mod}' as type FROM ${mod} WHERE is_deleted = FALSE AND title LIKE ?`;
      
      const params = [searchPattern];

      const [rows] = await db.query(query, params);
      return rows;
    });

    const results = await Promise.all(searchPromises);
    
    // Flatten and sort
    const allItems = results.flat().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return success(res, allItems);
  } catch (err) {
    console.error('Global search error:', err);
    return error(res, 'Global search failed');
  }
};

module.exports = {
  searchAll
};
