const db = require('../config/db');
const { success, error, paginate } = require('../utils/response');

// Helper to parse JSON strings from DB safely
const parseJsonSafely = (str) => {
  if (typeof str !== 'string') return str;
  try { return JSON.parse(str); } catch(e) { return null; }
};

const jsonFieldsMap = {
  articles: ['tags'],
  music: ['tags', 'desc', 'songs'],
  reviews: ['tags'],
  travel: ['itinerary', 'tips'],
  fashion: ['lookbook'],
  reading: ['tags'],
  food: ['ingredients', 'steps'],
  sports: ['splits']
};

const processRows = (tableName, rows) => {
  const jsonFields = jsonFieldsMap[tableName] || [];
  return rows.map(row => {
    const newRow = { ...row };
    jsonFields.forEach(field => {
      if (newRow[field]) {
        newRow[field] = parseJsonSafely(newRow[field]);
      }
    });
    // Add compatibility map for frontend expecting arrays instead of objects where applicable
    return newRow;
  });
};

// Generic GET with pagination, search, sorting
const getItems = async (tableName, req, res) => {
  try {
    let { page = 1, limit = 10, q, tag, sort = 'created_at', order = 'desc' } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM ${tableName} WHERE is_deleted = FALSE`;
    let countQuery = `SELECT COUNT(*) as total FROM ${tableName} WHERE is_deleted = FALSE`;
    const queryParams = [];
    const countParams = [];

    // Simple search across title and text fields
    if (q) {
      query += ` AND (title LIKE ?)`;
      countQuery += ` AND (title LIKE ?)`;
      const searchPattern = `%${q}%`;
      queryParams.push(searchPattern);
      countParams.push(searchPattern);
    }

    // JSON tag search (basic LIKE since full JSON search is complex in older MySQL)
    if (tag) {
       query += ` AND tags LIKE ?`;
       countQuery += ` AND tags LIKE ?`;
       const tagPattern = `%"${tag}"%`;
       queryParams.push(tagPattern);
       countParams.push(tagPattern);
    }

    // Sorting
    const validSortFields = ['createdAt', 'created_at', 'updated_at', 'id', 'views', 'likes', 'rating'];
    if (validSortFields.includes(sort)) {
       order = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
       // Default to id if created_at is passed but missing in some tables
       if (sort === 'created_at' && tableName === 'articles') sort = 'id';
       query += ` ORDER BY \`${sort}\` ${order}`;
    } else {
       query += ` ORDER BY id DESC`;
    }

    query += ` LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    const [rows] = await db.query(query, queryParams);
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    const parsedRows = processRows(tableName, rows);

    // If no pagination requested (limit=0 or similar), we could return all, but we standardized on paginate.
    // However, the frontend might break if it expects a raw array. 
    // Wait, the frontend `api/index.js` expects an Array directly: `return data.map(...)`.
    // So if the frontend calls `/articles` without page params, we MUST return a raw array to avoid breaking it, OR update frontend.
    // The instructions said "前端可以进行修改", so returning paginate structure is fine, we will update frontend next.
    return paginate(res, parsedRows, total, page, limit);

  } catch (err) {
    console.error(`Error fetching from ${tableName}:`, err);
    return error(res, 'Internal server error');
  }
};

const getItem = async (tableName, req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`SELECT * FROM ${tableName} WHERE id = ? AND is_deleted = FALSE`, [id]);
    if (rows.length === 0) return error(res, 'Item not found', 404);
    
    // Optionally increment views
    if (tableName === 'articles' || tableName === 'photo') {
      await db.query(`UPDATE ${tableName} SET views = views + 1 WHERE id = ?`, [id]);
    }
    
    const parsedRow = processRows(tableName, rows)[0];
    return success(res, parsedRow);
  } catch (err) {
    console.error(`Error fetching item from ${tableName}:`, err);
    return error(res, 'Internal server error');
  }
};

const createItem = async (tableName, req, res) => {
  try {
    const data = { ...req.body };
    // Set defaults for common fields
    if (!data.createdAt) data.createdAt = new Date().toISOString();
    if (data.is_deleted === undefined) data.is_deleted = 0;

    // Basic conversion of objects to JSON strings
    const jsonFields = jsonFieldsMap[tableName] || [];
    jsonFields.forEach(field => {
      if (data[field] && typeof data[field] === 'object') {
        data[field] = JSON.stringify(data[field]);
      }
    });

    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const sqlKeys = keys.map(k => (k === 'desc' || k === 'rank') ? `\`${k}\`` : k).join(', ');

    const [result] = await db.query(`INSERT INTO ${tableName} (${sqlKeys}) VALUES (${placeholders})`, values);
    return success(res, { id: result.insertId }, 'Created successfully', 201);
  } catch (err) {
    console.error(`Error creating in ${tableName}:`, err);
    return error(res, 'Creation failed');
  }
};

const updateItem = async (tableName, req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const jsonFields = jsonFieldsMap[tableName] || [];
    jsonFields.forEach(field => {
      if (data[field] && typeof data[field] === 'object') {
        data[field] = JSON.stringify(data[field]);
      }
    });

    const keys = Object.keys(data);
    const values = Object.values(data);
    
    if (keys.length === 0) return error(res, 'No data to update', 400);

    const setStr = keys.map(k => ((k === 'desc' || k === 'rank') ? `\`${k}\`` : k) + ' = ?').join(', ');
    values.push(id);

    const [result] = await db.query(`UPDATE ${tableName} SET ${setStr} WHERE id = ? AND is_deleted = FALSE`, values);
    if (result.affectedRows === 0) return error(res, 'Item not found or no changes', 404);
    
    return success(res, null, 'Updated successfully');
  } catch (err) {
    console.error(`Error updating in ${tableName}:`, err);
    return error(res, 'Update failed');
  }
};

const deleteItem = async (tableName, req, res) => {
  try {
    const { id } = req.params;
    // Soft delete
    const [result] = await db.query(`UPDATE ${tableName} SET is_deleted = TRUE WHERE id = ?`, [id]);
    if (result.affectedRows === 0) return error(res, 'Item not found', 404);
    
    return success(res, null, 'Deleted successfully');
  } catch (err) {
    console.error(`Error deleting from ${tableName}:`, err);
    return error(res, 'Delete failed');
  }
};

// Expose handlers for each module
const modules = ['articles', 'food', 'travel', 'photo', 'reading', 'music', 'reviews', 'fashion', 'sports', 'movie'];

const exportsObj = {};
modules.forEach(mod => {
  const capMod = mod.charAt(0).toUpperCase() + mod.slice(1);
  exportsObj[`get${capMod}`] = (req, res) => getItems(mod, req, res);
  exportsObj[`get${capMod}ById`] = (req, res) => getItem(mod, req, res);
  exportsObj[`create${capMod}`] = (req, res) => createItem(mod, req, res);
  exportsObj[`update${capMod}`] = (req, res) => updateItem(mod, req, res);
  exportsObj[`delete${capMod}`] = (req, res) => deleteItem(mod, req, res);
});

module.exports = exportsObj;
