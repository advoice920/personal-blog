const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
// const { verifyToken, isAdmin } = require('../middleware/authMiddleware'); 
// Will uncomment auth middleware after implementing it

const modules = ['articles', 'food', 'travel', 'photo', 'reading', 'music', 'reviews', 'fashion', 'sports', 'movie'];

modules.forEach(mod => {
  const capMod = mod.charAt(0).toUpperCase() + mod.slice(1);
  router.get(`/${mod}`, contentController[`get${capMod}`]);
  router.get(`/${mod}/:id`, contentController[`get${capMod}ById`]);
  // router.post(`/${mod}`, verifyToken, isAdmin, contentController[`create${capMod}`]);
  // router.put(`/${mod}/:id`, verifyToken, isAdmin, contentController[`update${capMod}`]);
  // router.delete(`/${mod}/:id`, verifyToken, isAdmin, contentController[`delete${capMod}`]);
  
  // Temporary without auth for testing
  router.post(`/${mod}`, contentController[`create${capMod}`]);
  router.put(`/${mod}/:id`, contentController[`update${capMod}`]);
  router.delete(`/${mod}/:id`, contentController[`delete${capMod}`]);
});

module.exports = router;
