const express = require('express');
const router = express.Router();
const rssService = require('../services/rssService');

// Trigger RSS fetch (pull latest articles from all sources)
router.post('/fetch', async (req, res) => {
  try {
    const count = await rssService.fetchAllAndSave();
    res.json({ code: 200, data: { fetched: count }, message: `成功拉取 ${count} 篇文章` });
  } catch (err) {
    console.error('[RSS Route] fetch error:', err);
    res.status(500).json({ error: '拉取失败' });
  }
});

// Get cached RSS articles
router.get('/articles', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 25;
  const mineOnly = req.query.mine === '1';
  const result = await rssService.getRssArticles(page, limit, mineOnly);
  res.json({ code: 200, data: result });
});

// List configured feed sources
router.get('/sources', (req, res) => {
  res.json({ code: 200, data: rssService.DEFAULT_FEEDS });
});

module.exports = router;
