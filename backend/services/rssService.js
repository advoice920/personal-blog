const axios = require('axios');
const cheerio = require('cheerio');
const { XMLParser } = require('fast-xml-parser');
const db = require('../config/db');

// Pre-configured Chinese RSS feed sources
const DEFAULT_FEEDS = [
  {
    name: '阮一峰的网络日志',
    url: 'https://www.ruanyifeng.com/blog/atom.xml',
    type: 'atom',
  },
  {
    name: '少数派',
    url: 'https://sspai.com/feed',
    type: 'rss',
  },
  {
    name: '36氪',
    url: 'https://www.36kr.com/feed',
    type: 'rss',
  },
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
});

/**
 * Normalize a URL string (remove CDATA wrappers, trim)
 */
function clean(s) {
  if (!s) return '';
  if (typeof s !== 'string') return String(s);
  return s.replace(/<!\[CDATA\[|\]\]>/g, '').trim();
}

/**
 * Strip HTML tags to get plain text summary
 */
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().substring(0, 300);
}

/**
 * Extract first image URL from HTML content
 */
function extractImage(html) {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

/**
 * Fetch and parse a single RSS/Atom feed
 */
async function fetchFeed(url, feedType) {
  try {
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
    });

    const xml = response.data;
    const parsed = parser.parse(xml);

    // Handle both RSS and Atom formats
    let entries = [];

    if (feedType === 'atom') {
      const feed = parsed.feed || {};
      const rawEntries = feed.entry || [];
      entries = (Array.isArray(rawEntries) ? rawEntries : [rawEntries]).map(e => ({
        title: clean(e.title),
        link: (e.link && (Array.isArray(e.link) ? e.link.find(l => l['@_rel'] === 'alternate')?.['@_href'] || e.link[0]?.['@_href'] : e.link['@_href'] || e.link)) || '',
        summary: stripHtml(clean(e.summary || e.content?.['#text'] || e.content || '')),
        thumbnail: extractImage(clean(e.content?.['#text'] || e.content || e.summary || '')),
        author: clean(e.author?.name || (Array.isArray(e.author) ? e.author[0]?.name : '')),
        published: e.published || e.updated || new Date().toISOString(),
      }));
    } else {
      // RSS 2.0
      const channel = parsed.rss?.channel || {};
      const items = channel.item || [];
      entries = (Array.isArray(items) ? items : [items]).map(e => ({
        title: clean(e.title),
        link: clean(e.link),
        summary: stripHtml(clean(e.description || e['content:encoded'] || '')),
        thumbnail: extractImage(clean(e['content:encoded'] || e.description || '')),
        author: clean(e['dc:creator'] || e.author || ''),
        published: e.pubDate || new Date().toISOString(),
      }));
    }

    return entries.filter(e => e.title && e.link);
  } catch (err) {
    console.error(`[RSS] Failed to fetch ${url}:`, err.message);
    return [];
  }
}

/**
 * Fetch full article content from its URL, preserving images
 */
async function fetchFullContent(url) {
  try {
    const { data: html } = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, footer, header, aside, .sidebar, .comment, .ad, .advertisement, .recommend, .related, .share, .social, .copyright, [class*="banner"], [class*="menu"], [class*="footer"], [class*="header"], [class*="sidebar"], [class*="comment"], [class*="recommend"], [class*="related"], iframe').remove();

    // Try common article content selectors
    const selectors = [
      'article', '.article-content', '.post-content', '.content', '.article', '.post',
      '.entry-content', '.article-body', '.post-body', '[class*="article"]',
      '#article', '#content', '.rich_media_content', '.news_content',
      '.detail-content', '.article-detail',
    ];

    let $content = null;
    let bestLen = 0;
    for (const sel of selectors) {
      const el = $(sel);
      if (el.length > 0) {
        const len = el.text().trim().length;
        if (len > bestLen) { bestLen = len; $content = el; }
      }
    }

    // If no content found, try body paragraphs
    if (!$content || bestLen < 100) {
      const $ps = $('p').filter((i, el) => $(el).text().trim().length > 20);
      if ($ps.length > 0) {
        $content = $('<div>').append($ps.clone());
        bestLen = $content.text().trim().length;
      }
    }

    // Fallback: body
    if (!$content || bestLen < 50) {
      $content = $('body');
    }

    // Process images: make relative URLs absolute, add styles
    $content.find('img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original') || '';
      if (src) {
        // Make URL absolute if relative
        try {
          const absolute = new URL(src, url).href;
          $(el).attr('src', absolute);
        } catch(e) {
          // Keep original if parsing fails
        }
        $(el).attr('style', 'max-width:100%;height:auto;display:block;margin:16px auto;border-radius:8px;');
        // Remove data-src and data-original to avoid lazy load conflicts
        $(el).removeAttr('data-src').removeAttr('data-original');
      }
    });

    // Also handle <a> links — make relative URLs absolute
    $content.find('a').each((i, el) => {
      const href = $(el).attr('href') || '';
      if (href && !href.startsWith('http') && !href.startsWith('#')) {
        try {
          $(el).attr('href', new URL(href, url).href);
        } catch(e) {}
      }
    });

    return $content.html().trim().substring(0, 100000); // Cap at 100k chars HTML
  } catch (err) {
    console.warn(`[RSS] Failed to fetch full content from ${url}:`, err.message);
    return null;
  }
}

/**
 * Fetch all configured feeds and save new articles to DB
 */
async function fetchAllAndSave() {
  const allArticles = [];
  for (const feed of DEFAULT_FEEDS) {
    console.log(`[RSS] Fetching: ${feed.name} (${feed.url})`);
    const entries = await fetchFeed(feed.url, feed.type);
    for (const entry of entries) {
      allArticles.push(entry);
      // Upsert to DB (by link)
      try {
        const [existing] = await db.query(
          'SELECT id FROM articles WHERE link = ?', [entry.link]
        );
        if (existing.length === 0) {
          // If RSS already contains full content (>500 chars plain text), use it directly
          const summaryText = stripHtml(entry.summary);
          let articleContent;
          if (summaryText.length > 800) {
            articleContent = entry.summary; // Already full content in RSS
          } else {
            // Fetch full article content from the original URL
            const fullContent = await fetchFullContent(entry.link);
            articleContent = fullContent || entry.summary;
          }

          await db.query(
            `INSERT INTO articles (title, summary, content, thumbnail, author_name, author_avatar, link, source, tags, views, likes, category, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              entry.title,
              entry.summary,
              articleContent,  // Full content from scraping
              entry.thumbnail || `https://tse2-mm.cn.bing.net/th?q=${encodeURIComponent(entry.title.substring(0, 12))}&w=400&h=600&c=7&rs=1&p=0&dpr=1&pid=1.7&mkt=zh-CN`,
              entry.author || '未名作者',
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(entry.author || 'author')}`,
              entry.link,
              feed.name,
              JSON.stringify([feed.name]),
              Math.floor(Math.random() * 5000) + 100,
              Math.floor(Math.random() * 500) + 10,
              feed.name,
              entry.published,
            ]
          );
        }
      } catch (err) {
        // Skip duplicates / DB errors
        if (!err.message.includes('Duplicate') && !err.message.includes('UNIQUE')) {
          console.error(`[RSS] DB insert error:`, err.message);
        }
      }
    }
    console.log(`[RSS] ${feed.name}: ${entries.length} articles fetched`);
  }
  return allArticles.length;
}

/**
 * Get articles from DB (RSS cached)
 */
async function getRssArticles(page = 1, limit = 25, mineOnly = false) {
  const offset = (page - 1) * limit;
  let where = 'is_deleted = 0';
  if (mineOnly) {
    where += " AND (source IS NULL OR source = '')";
  }
  const [rows] = await db.query(
    `SELECT * FROM articles WHERE ${where} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM articles WHERE ${where}`
  );
  return { items: rows, total };
}

module.exports = { fetchAllAndSave, getRssArticles, DEFAULT_FEEDS };
