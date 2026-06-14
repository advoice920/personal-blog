const express = require('express');
const router = express.Router();
const axios = require('axios');

// Proxy external images to bypass CORS/Referrer restrictions
router.get('/', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send('Missing url parameter');
  }

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'Referer': new URL(url).origin,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const contentType = response.headers['content-type'] || 'image/jpeg';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400'); // Cache 1 day
    res.set('Access-Control-Allow-Origin', '*');
    res.send(Buffer.from(response.data));
  } catch (err) {
    console.error(`[ImageProxy] Failed: ${url.substring(0, 80)} — ${err.message}`);
    res.status(500).send('Image proxy error');
  }
});

module.exports = router;
