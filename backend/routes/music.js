const express = require('express');
const router = express.Router();
const musicService = require('../services/musicService');

// Search songs on NetEase
router.get('/search', async (req, res) => {
  const { keyword, limit } = req.query;
  if (!keyword) {
    return res.status(400).json({ error: '请输入搜索关键词' });
  }
  const results = await musicService.searchSongs(keyword, parseInt(limit) || 10);
  res.json({ code: 200, data: results });
});

// Search song + save to DB + return with audio URL
router.post('/search-and-save', async (req, res) => {
  const { keyword } = req.body;
  if (!keyword) {
    return res.status(400).json({ error: '请输入搜索关键词' });
  }
  try {
    const song = await musicService.searchAndSave(keyword);
    if (!song) {
      return res.status(404).json({ error: '未找到该歌曲' });
    }
    // Refresh URL to make sure it's fresh
    const freshUrl = await musicService.refreshSongUrl(song.netease_id || song.neteaseId);
    res.json({ code: 200, data: { ...song, audioUrl: freshUrl || song.audio_url } });
  } catch (err) {
    console.error('[MusicRoute] search-and-save error:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// Get song audio URL
router.get('/song-url/:neteaseId', async (req, res) => {
  const url = await musicService.getSongUrl(req.params.neteaseId);
  if (!url) {
    return res.status(404).json({ error: '未找到播放链接' });
  }
  res.json({ code: 200, data: { url } });
});

// Get all saved songs
router.get('/saved', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const result = await musicService.getSavedSongs(page, limit);
  res.json({ code: 200, data: result });
});

// Refresh song URL (for cached songs whose URL expired)
router.post('/refresh-url/:neteaseId', async (req, res) => {
  const url = await musicService.refreshSongUrl(req.params.neteaseId);
  if (!url) {
    return res.status(404).json({ error: '无法刷新播放链接' });
  }
  res.json({ code: 200, data: { url } });
});

module.exports = router;
