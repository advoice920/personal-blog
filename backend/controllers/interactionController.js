const db = require('../config/db');
const { success, error, paginate } = require('../utils/response');

const getComments = async (req, res) => {
  try {
    const { module, itemId } = req.params;
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const query = `
      SELECT c.*, u.email as user_email 
      FROM comments c 
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.module_name = ? AND c.item_id = ? 
      ORDER BY c.created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const countQuery = `SELECT COUNT(*) as total FROM comments WHERE module_name = ? AND item_id = ?`;

    const [rows] = await db.query(query, [module, itemId, limit, offset]);
    const [countResult] = await db.query(countQuery, [module, itemId]);

    return paginate(res, rows, countResult[0].total, page, limit);
  } catch (err) {
    console.error('Error fetching comments:', err);
    return error(res, 'Failed to fetch comments');
  }
};

const addComment = async (req, res) => {
  try {
    const { module_name, item_id, content } = req.body;
    if (!module_name || !item_id || !content) {
      return error(res, 'Missing required fields', 400);
    }

    const [result] = await db.query(
      'INSERT INTO comments (module_name, item_id, user_id, content) VALUES (?, ?, ?, ?)',
      [module_name, item_id, req.userId, content]
    );

    return success(res, { id: result.insertId }, 'Comment added', 201);
  } catch (err) {
    console.error('Error adding comment:', err);
    return error(res, 'Failed to add comment');
  }
};

const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const [comment] = await db.query('SELECT user_id FROM comments WHERE id = ?', [id]);
    
    if (comment.length === 0) return error(res, 'Comment not found', 404);
    if (comment[0].user_id !== req.userId && req.userRole !== 'admin') {
      return error(res, 'Unauthorized to delete this comment', 403);
    }

    await db.query('DELETE FROM comments WHERE id = ?', [id]);
    return success(res, null, 'Comment deleted');
  } catch (err) {
    console.error('Error deleting comment:', err);
    return error(res, 'Failed to delete comment');
  }
};

const getLikes = async (req, res) => {
  try {
    const { module, itemId } = req.params;
    
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM likes_interaction WHERE module_name = ? AND item_id = ?',
      [module, itemId]
    );
    
    let userLiked = false;
    if (req.userId) { // Could be passed if token verified loosely, but usually requires token
      const [userLike] = await db.query(
        'SELECT id FROM likes_interaction WHERE module_name = ? AND item_id = ? AND user_id = ?',
        [module, itemId, req.userId]
      );
      userLiked = userLike.length > 0;
    }

    return success(res, { total: countResult[0].total, userLiked });
  } catch (err) {
    console.error('Error fetching likes:', err);
    return error(res, 'Failed to fetch likes');
  }
};

const toggleLike = async (req, res) => {
  try {
    const { module_name, item_id } = req.body;
    if (!module_name || !item_id) {
      return error(res, 'Missing required fields', 400);
    }

    const [existingLike] = await db.query(
      'SELECT id FROM likes_interaction WHERE module_name = ? AND item_id = ? AND user_id = ?',
      [module_name, item_id, req.userId]
    );

    if (existingLike.length > 0) {
      // Unlike
      await db.query('DELETE FROM likes_interaction WHERE id = ?', [existingLike[0].id]);
      
      // Update the main table likes count (optional denormalization)
      try {
        await db.query(`UPDATE \`${module_name}\` SET likes = GREATEST(likes - 1, 0) WHERE id = ?`, [item_id]);
      } catch(e) {} // ignore if table doesn't have likes column

      return success(res, { action: 'unliked' }, 'Unliked');
    } else {
      // Like
      await db.query(
        'INSERT INTO likes_interaction (module_name, item_id, user_id) VALUES (?, ?, ?)',
        [module_name, item_id, req.userId]
      );

      try {
        await db.query(`UPDATE \`${module_name}\` SET likes = likes + 1 WHERE id = ?`, [item_id]);
      } catch(e) {}

      return success(res, { action: 'liked' }, 'Liked', 201);
    }
  } catch (err) {
    console.error('Error toggling like:', err);
    return error(res, 'Failed to toggle like');
  }
};

module.exports = {
  getComments,
  addComment,
  deleteComment,
  getLikes,
  toggleLike
};
