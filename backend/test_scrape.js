const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const url = 'http://www.xinhuanet.com/travel/20260605/66f836e3c0ac40458da17a0e6496201f/c.html';
  const response = await axios.get(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      responseType: 'arraybuffer',
      timeout: 10000
  });
  let html = response.data.toString('utf-8');
  console.log('HTML Length:', html.length);
  const $ = cheerio.load(html);
  $('script, style, iframe, nav, footer, header, .nav, .footer, .header, aside, .sidebar').remove();
  let content = $('#detail').html() || $('.article').html() || $('.post_body').html() || $('.article-content').html() || $('article').html() || $('.content').html() || $('.main').html() || $('body').html();
  console.log('Content extracted:', !!content);
  if (content) console.log('Content preview:', content.substring(0, 100));
}
test();
