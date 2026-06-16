/**
 * 必应图片搜索服务 — 根据关键词抓取真实图片
 */
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../config/db');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 各分类的搜索关键词
const CATEGORY_KEYWORDS = {
  '动物': ['威风的狮子', '可爱的小猫', '奔跑的猎豹', '深海鲸鱼', '飞翔的翠鸟', '野生大熊猫'],
  '自然风光': ['瑞士雪山', '冰岛极光', '喀纳斯湖', '张家界云海', '黄石国家公园'],
  '城市风光': ['重庆洪崖洞', '上海陆家嘴', '巴黎铁塔夜景', '香港街景', '东京涩谷'],
  '建筑': ['欧洲古堡', '现代极简建筑', '哥特式教堂', '苏州园林', '迪拜哈利法塔'],
  '人文纪实': ['藏族老人肖像', '菜市场烟火气', '传统手工艺人', '街头艺人', '节日游行'],
  '夜景': ['星空银河', '城市车水马龙', '霓虹灯牌夜景', '雪夜街景', '萤火虫森林'],
  '航拍': ['海岸线航拍', '沙漠航拍', '立交桥航拍', '梯田航拍', '雪山航拍'],
  '肖像': ['少女写真', '儿童笑脸', '时尚模特', '老人肖像', '黑白人像摄影'],
  '微距': ['露水微距', '花蕊特写', '蝴蝶翅膀微距', '雪花微距', '昆虫微距摄影'],
  '植物': ['热带雨林', '盛开的玫瑰', '秋日红叶', '仙人掌特写', '樱花大道'],
  '黑白': ['黑白街拍', '黑白光影', '黑白人像', '黑白建筑', '黑白风景摄影'],
  '时尚': ['时装周走秀', '街拍穿搭', '复古胶片', '高级定制礼服', '首饰特写'],
  '水下': ['珊瑚礁', '潜水员与海龟', '深海鱼群', '沉船探险', '水母'],
};

/**
 * 从 Bing 图片搜索抓取图片
 */
async function searchBingImages(keyword, count = 5) {
  try {
    const url = `https://cn.bing.com/images/search?q=${encodeURIComponent(keyword + ' 摄影 高清')}&first=1& count=${count}&mkt=zh-CN`;
    const { data: html } = await axios.get(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html' },
      timeout: 8000,
    });

    const $ = cheerio.load(html);
    const images = [];

    // Bing 图片搜索结果在 .iusc 元素的 m 属性中（JSON）
    $('.iusc').each((i, el) => {
      try {
        const mAttr = $(el).attr('m');
        if (mAttr) {
          const meta = JSON.parse(mAttr);
          if (meta.murl && images.length < count) {
            images.push({
              url: meta.murl,
              thumb: meta.turl || meta.murl,
              width: meta.w || 800,
              height: meta.h || 600,
              title: meta.desc || keyword,
            });
          }
        }
      } catch (e) { /* skip parse errors */ }
    });

    // 如果没找到 .iusc，尝试直接找 img 标签
    if (images.length === 0) {
      $('img.mimg').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && src.startsWith('http') && images.length < count) {
          images.push({
            url: src,
            thumb: src,
            width: 800,
            height: 600,
            title: keyword,
          });
        }
      });
    }

    console.log(`[Photo] Bing search "${keyword}": ${images.length} images`);
    return images;
  } catch (err) {
    console.error(`[Photo] Bing search error for "${keyword}":`, err.message);
    return [];
  }
}

/**
 * 获取所有分类的照片
 */
async function getAllPhotos(category = '', page = 1, limit = 12) {
  // 先从数据库获取
  try {
    let query = 'SELECT * FROM photo WHERE is_deleted = 0';
    const params = [];
    if (category && category !== '全部') {
      query += ' AND category LIKE ?';
      params.push(`%${category}%`);
    }
    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const [rows] = await db.query(query, params);
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) as total FROM photo WHERE is_deleted = 0' + (category && category !== '全部' ? ' AND category LIKE ?' : ''),
      category && category !== '全部' ? [`%${category}%`] : []
    );

    if (rows.length > 0) {
      return { items: rows, total };
    }
  } catch (err) {
    console.error('[Photo] DB query error:', err.message);
  }

  // 数据库没数据 → 从 Bing 搜索
  const cats = category ? [category] : Object.keys(CATEGORY_KEYWORDS).slice(0, 6);
  const allImages = [];

  for (const cat of cats) {
    const keywords = CATEGORY_KEYWORDS[cat] || [cat];
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];
    const images = await searchBingImages(keyword, 3);
    images.forEach(img => {
      allImages.push({
        id: 0,
        title: img.title,
        url: img.url,
        thumb: img.thumb,
        width: img.width,
        height: img.height,
        category: cat,
        author: 'Bing图库',
        avatar: '',
        views: 0,
        likes: 0,
      });
    });
    await new Promise(r => setTimeout(r, 500)); // 礼貌延迟
  }

  const total = allImages.length;
  const start = (page - 1) * limit;
  const paged = allImages.slice(start, start + limit);
  return { items: paged, total };
}

/**
 * 按关键词搜索照片（实时）
 */
async function searchPhotos(keyword, page = 1, limit = 12) {
  const images = await searchBingImages(keyword, limit * 2);
  const start = (page - 1) * limit;
  const paged = images.slice(start, start + limit);

  return {
    items: paged.map(img => ({
      id: 0,
      title: img.title || keyword,
      url: img.url,
      thumb: img.thumb,
      width: img.width || 800,
      height: img.height || 600,
      category: '',
      author: 'Bing搜索',
      avatar: '',
      views: 0,
      likes: 0,
    })),
    total: images.length,
  };
}

module.exports = { getAllPhotos, searchPhotos, searchBingImages, CATEGORY_KEYWORDS };
