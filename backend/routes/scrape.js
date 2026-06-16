const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

router.get('/', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const response = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9'
      },
      responseType: 'arraybuffer',
      timeout: 10000
    });
    
    // Convert to string. Most news sites are utf-8.
    let html = response.data.toString('utf-8');
    
    // If it looks like GBK (has meta charset=gb2312 or gbk), we would need iconv, but we'll try a fallback
    if (html.toLowerCase().includes('charset=gb')) {
      // In a robust app, use iconv-lite. For now, try default decoder.
    }
    
    const $ = cheerio.load(html);
    
    // Remove unwanted elements
    $('script, style, iframe, nav, footer, header, .nav, .footer, .header, aside, .sidebar').remove();
    
    // Attempt to find the main article container
    let content = $('#detail').html() || 
                  $('.article').html() || 
                  $('.post_body').html() || 
                  $('.article-content').html() || 
                  $('article').html() || 
                  $('.content').html() || 
                  $('.main').html() ||
                  $('body').html();
                  
    if (!content) {
      return res.json({ content: '<p>无法精准提取正文，请点击底部的“阅读原文”。</p>' });
    }

    res.json({ content });
  } catch (error) {
    console.error('Scrape error:', error.message);
    res.status(500).json({ error: '获取原文失败' });
  }
});

module.exports = router;
