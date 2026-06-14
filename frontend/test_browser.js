const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });
    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
    });
    
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 10000 });
    
    // Check if there are any articles
    const articlesCount = await page.$$eval('.article-card', els => els.length);
    console.log('ARTICLES COUNT:', articlesCount);
    
    await browser.close();
  } catch (e) {
    console.error('PUPPETEER ERR:', e.message);
    process.exit(1);
  }
})();
