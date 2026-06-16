/**
 * 豆瓣电影数据服务 — 爬取 Top250 + 分类列表
 */
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../config/db');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 类型→豆瓣标签映射
const GENRE_TAGS = {
  '科幻': '科幻',
  '剧情': '剧情',
  '动作': '动作',
  '喜剧': '喜剧',
  '悬疑': '悬疑',
  '爱情': '爱情',
  '动画': '动画',
  '纪录片': '纪录片',
};

/**
 * 从豆瓣列表页解析电影
 */
function parseMovieList(html) {
  const $ = cheerio.load(html);
  const movies = [];

  $('.item').each((i, el) => {
    const $el = $(el);
    const $pic = $el.find('.pic');
    const $info = $el.find('.info');

    const link = $pic.find('a').attr('href') || '';
    const cover = $pic.find('img').attr('src') || '';
    const titleCn = $info.find('.title').first().text().trim();
    const titleEn = $info.find('.title').eq(1).text().trim().replace(/^\s*\/\s*/, '');
    const rating = parseFloat($info.find('.rating_num').text().trim()) || 0;
    const ratingPeople = ($info.find('.star span').eq(3).text() || '').replace(/[^0-9]/g, '');
    const quote = ($info.find('.quote .inq').text() || '').trim();

    // 豆瓣 subject id
    const subjectId = link.match(/subject\/(\d+)/)?.[1] || '';

    if (titleCn) {
      movies.push({
        subjectId,
        title: titleCn,
        titleEn,
        cover,
        link,
        rating,
        ratingPeople: parseInt(ratingPeople) || 0,
        quote,
      });
    }
  });

  return movies;
}

/**
 * 获取 Top250 电影列表
 */
async function fetchTop250(start = 0) {
  try {
    const { data: html } = await axios.get('https://movie.douban.com/top250', {
      params: { start, filter: '' },
      headers: { 'User-Agent': UA, 'Accept': 'text/html' },
      timeout: 10000,
    });
    const movies = parseMovieList(html);
    console.log(`[Douban] Top250 start=${start}: ${movies.length} movies`);
    return movies;
  } catch (err) {
    console.error(`[Douban] Top250 fetch error:`, err.message);
    return [];
  }
}

/**
 * 按标签获取电影列表
 */
async function fetchByTag(tag, start = 0) {
  try {
    const { data: html } = await axios.get('https://movie.douban.com/tag/', {
      params: { tag: tag, start },
      headers: { 'User-Agent': UA, 'Accept': 'text/html' },
      timeout: 10000,
    });
    const movies = parseMovieList(html);
    console.log(`[Douban] Tag="${tag}" start=${start}: ${movies.length} movies`);
    return movies;
  } catch (err) {
    console.error(`[Douban] Tag fetch error:`, err.message);
    return [];
  }
}

/**
 * 获取全部 Top250 + 分类电影
 */
async function fetchAllMovies() {
  const allMovies = [];

  // Top250: 每页25条，共10页
  for (let start = 0; start < 250; start += 25) {
    const movies = await fetchTop250(start);
    allMovies.push(...movies);
    if (movies.length < 25) break; // 没更多了
    // 礼貌延迟，避免被封
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`[Douban] Total fetched: ${allMovies.length} movies`);
  return allMovies;
}

/**
 * 同步到数据库
 */
async function syncToDb(movies) {
  let added = 0;
  let skipped = 0;

  for (const m of movies) {
    try {
      const [existing] = await db.query(
        'SELECT id FROM movie WHERE title = ?', [m.title]
      );
      if (existing.length > 0) {
        skipped++;
        continue;
      }

      await db.query(
        `INSERT INTO movie (title, rating, cover, \`desc\`, tags, status)
         VALUES (?, ?, ?, ?, ?, 'published')`,
        [
          m.title,
          m.rating,
          m.cover,
          m.quote || m.title,
          JSON.stringify(['豆瓣Top250']),
        ]
      );
      added++;
    } catch (err) {
      if (!err.message.includes('Duplicate')) {
        console.error(`[Douban] Insert error for ${m.title}:`, err.message);
      }
    }
  }

  console.log(`[Douban] Sync: ${added} added, ${skipped} skipped`);
  return { added, skipped };
}

module.exports = { fetchTop250, fetchByTag, fetchAllMovies, syncToDb, GENRE_TAGS };
