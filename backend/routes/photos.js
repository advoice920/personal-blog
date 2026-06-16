const express = require('express');
const router = express.Router();
const photoService = require('../services/photoService');

// GET /api/photos?category=动物&page=1&limit=12
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 12 } = req.query;
    const result = await photoService.getAllPhotos(category || '', parseInt(page), parseInt(limit));
    res.json({ code: 200, message: 'Success', data: result });
  } catch (err) {
    console.error('[PhotoRoute] Error:', err);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

// GET /api/photos/search?q=狮子&page=1&limit=12
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;
    if (!q) return res.status(400).json({ code: 400, message: 'Missing keyword' });
    const result = await photoService.searchPhotos(q, parseInt(page), parseInt(limit));
    res.json({ code: 200, message: 'Success', data: result });
  } catch (err) {
    console.error('[PhotoRoute] Search error:', err);
    res.status(500).json({ code: 500, message: 'Internal server error' });
  }
});

module.exports = router;
