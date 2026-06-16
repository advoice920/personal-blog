import axios from 'axios'
import initSqlJs from 'sql.js/dist/sql-wasm-browser.js'
import { ElMessage } from 'element-plus'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// --- Global API Loading Indicator ---
let loadingCount = 0;
let loadingEl = null;

const showTopLoading = () => {
  if (loadingCount === 0) {
    loadingEl = document.createElement('div');
    loadingEl.className = 'fixed top-6 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-md rounded-full px-4 py-2 flex items-center justify-center z-[9999] border border-gray-200 dark:border-gray-700 transition-all duration-300';
    loadingEl.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="text-sm font-medium text-gray-700 dark:text-gray-200">刷新数据中...</span>
    `;
    document.body.appendChild(loadingEl);
  }
  loadingCount++;
};

const hideTopLoading = () => {
  loadingCount--;
  if (loadingCount <= 0) {
    loadingCount = 0;
    if (loadingEl) {
      const elToRemove = loadingEl;
      loadingEl = null;
      elToRemove.style.opacity = '0';
      elToRemove.style.transform = 'translate(-50%, -10px)';
      setTimeout(() => {
        if (elToRemove.parentNode) {
          elToRemove.parentNode.removeChild(elToRemove);
        }
      }, 300);
    }
  }
};

axios.interceptors.request.use(config => {
  showTopLoading();
  return config;
});

axios.interceptors.response.use(response => {
  hideTopLoading();
  return response;
}, error => {
  hideTopLoading();
  return Promise.reject(error);
});
// ------------------------------------

// We keep a single instance of the SQLite database
let dbInstance = null

// Circuit Breaker to prevent UI lag when APIs are blocked
// Persist health state in localStorage so the user doesn't experience the 1.5s lag on every F5 refresh.
const defaultApiHealth = {
  travel: true,
  food: true,
  music: true,
  reading: true,
  movie: true,
  articles: true
};

let apiHealth;
try {
  apiHealth = JSON.parse(localStorage.getItem('blog_api_health')) || defaultApiHealth;
} catch (e) {
  apiHealth = defaultApiHealth;
}

const markApiFailed = (key) => {
  apiHealth[key] = false;
  try {
    localStorage.setItem('blog_api_health', JSON.stringify(apiHealth));
  } catch (e) {}
};

async function getLocalDB() {
  if (dbInstance) return dbInstance
  
  try {
    // 1. Initialize sql.js (Browser specific build)
    const SQL = await initSqlJs({
      locateFile: file => `/${file}` // Load sql-wasm.wasm from public folder
    })
    
    // 2. Fetch the mock.sqlite file from the public folder
    const response = await fetch('/mock.sqlite')
    if (!response.ok) throw new Error('Failed to load mock.sqlite')
    
    const buffer = await response.arrayBuffer()
    
    // 3. Mount it
    dbInstance = new SQL.Database(new Uint8Array(buffer))
    return dbInstance
  } catch (error) {
    console.error('Failed to initialize local SQLite database:', error)
    throw error
  }
}

/**
 * Execute a query against the local SQLite database.
 */
async function queryLocalDB(sql, params = []) {
  const db = await getLocalDB()
  const stmt = db.prepare(sql)
  stmt.bind(params)
  
  const results = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  
  return results
}

/**
 * Helper to parse JSON fields that were stringified when inserting into SQLite
 */
function parseJsonFields(rows, fields) {
  return rows.map(row => {
    fields.forEach(field => {
      if (row[field] && typeof row[field] === 'string') {
        try {
          row[field] = JSON.parse(row[field])
        } catch (e) {
          // If it fails, leave it as is
        }
      }
    })
    return row
  })
}

/**
 * Dual-Layer Fetch: Try real API first, fallback to Local SQLite
 */
async function fetchWithFallback(endpoint, tableName, jsonFields = [], params = {}) {
  let data = null;
  if (API_BASE_URL) {
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, { params, timeout: 1500 })
      if (response.data && response.data.code === 200 && response.data.data) {
        // Return full pagination object if page is requested
        if (params.page && response.data.data.items !== undefined) {
          data = response.data.data;
        } else if (response.data.data.items !== undefined) {
          data = response.data.data.items; // Fallback to array
        } else {
          data = response.data.data;
        }
      } else {
        data = response.data;
      }
    } catch (error) {
      console.warn(`[API] Failed to fetch ${endpoint} from real API, falling back to local SQLite...`, error)
    }
  }
  
  if (!data) {
    // Fallback to SQLite
    console.log(`[Mock SQLite] Fetching data from table: ${tableName}`)
    let sql = `SELECT * FROM ${tableName}`;
    const sqlParams = [];
    const conditions = [];
    
    if (params.q) {
      conditions.push(`title LIKE ?`);
      sqlParams.push(`%${params.q}%`);
    }
    if (params.tag) {
      conditions.push(`tags LIKE ?`);
      sqlParams.push(`%"${params.tag}"%`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }
    if (params.sort) {
      const orderDir = params.order === 'asc' ? 'ASC' : 'DESC';
      sql += ` ORDER BY ${params.sort} ${orderDir}`;
    }
    if (params.page && params.limit) {
      sql += ` LIMIT ? OFFSET ?`;
      sqlParams.push(parseInt(params.limit), (parseInt(params.page) - 1) * parseInt(params.limit));
    }
    
    const rows = await queryLocalDB(sql, sqlParams)
    const parsedData = parseJsonFields(rows, jsonFields)
    
    if (params.page) {
      let countSql = `SELECT COUNT(*) as total FROM ${tableName}`;
      if (conditions.length > 0) {
        countSql += ` WHERE ` + conditions.join(' AND ');
      }
      const countRows = await queryLocalDB(countSql, sqlParams.slice(0, sqlParams.length - 2));
      data = {
        items: parsedData,
        total: countRows[0] ? countRows[0].total : 0
      }
    } else {
      data = parsedData;
    }
  }

  // Fix: Replace loremflickr.com URLs which now frequently return distorted cat images.
  const processItems = (itemsList) => {
    return itemsList.map(item => {
      const newItem = { ...item };
      ['img', 'cover', 'thumbnail', 'map', 'author_avatar', 'url'].forEach(key => {
        if (newItem[key] && typeof newItem[key] === 'string' && newItem[key].includes('loremflickr.com')) {
          const width = key.includes('avatar') ? 100 : 400;
          const height = key.includes('avatar') ? 100 : 600;
          
          const parts = newItem[key].split('/');
          let keywords = '';
          if (parts.length >= 6) {
             const keywordPart = parts[5].split('?')[0];
             keywords = keywordPart.replace(/,/g, ' ');
          }
          
          if (keywords && keywords !== 'all') {
            newItem[key] = `https://tse2-mm.cn.bing.net/th?q=${encodeURIComponent(keywords + ' 高清壁纸')}&w=${width}&h=${height}&c=7&rs=1&p=0&dpr=1&pid=1.7&mkt=zh-CN&adlt=moderate`;
          } else {
            newItem[key] = `https://picsum.photos/seed/${tableName}_${item.id}_${key}/${width}/${height}`;
          }
        }
      });
      return newItem;
    });
  };

  if (data && Array.isArray(data.items)) {
    data.items = processItems(data.items);
  } else if (Array.isArray(data)) {
    return processItems(data);
  }
  
  return data;
}

// --- API Methods ---

export const getArticles = async (params = {}) => {
  const page = params.page || 1;
  const limit = params.limit || 25;

  // Primary: use RSS data from our own backend (always available, never limited)
  try {
    const baseUrl = API_BASE_URL || '/api';
    const response = await axios.get(`${baseUrl}/rss/articles`, {
      params: { page, limit },
      timeout: 3000
    });
    if (response.data?.code === 200 && response.data?.data) {
      const { items, total } = response.data.data;
      if (items && items.length > 0) {
        const mappedItems = items.map(a => ({
          ...a,
          category: a.category || a.source || 'article',
          author: { name: a.author_name || '未名作者', avatar: a.author_avatar },
          likes: a.likes || Math.floor(Math.random() * 500) + 10,
          views: a.views || Math.floor(Math.random() * 5000) + 100,
          createdAt: a.createdAt || a.created_at,
        }));
        return { items: mappedItems, total: total || items.length, isRss: true };
      }
    }
  } catch (e) {
    console.warn('[API] RSS articles fetch failed, trying local DB...', e.message);
  }

  // Fallback: Local SQLite / DB
  markApiFailed('articles');
  const res = await fetchWithFallback('/articles', 'articles', ['tags'], params);
  const items = params.page ? (res.items || res) : (Array.isArray(res) ? res : (res.items || []));
  if (!items || !Array.isArray(items)) {
    return { items: [], total: 0 };
  }
  const mappedItems = items.map(a => ({
    ...a,
    author: { name: a.author_name, avatar: a.author_avatar }
  }));
  if (params.page) {
    return { items: mappedItems, total: res.total || mappedItems.length, isApi: false };
  }
  return { items: mappedItems, isApi: false };
}

export const getTianApiData = async (category, params = {}) => {
  try {
    const page = params.page || 1;
    const limit = params.limit || 20;
    
    const queryParams = new URLSearchParams({ page, num: limit });
    if (params.word) queryParams.set('word', params.word);
    if (params.tag) queryParams.set('tag', params.tag);
    const url = `${API_BASE_URL}/tianapi/${category}?${queryParams.toString()}`;
    
    const response = await axios.get(url, { timeout: 5000 });
    
    if (response.data?.code !== 200) {
      throw new Error(response.data?.msg || 'TianAPI error');
    }

    const result = response.data?.data;
    if (!result || !result.items || !Array.isArray(result.items)) {
      throw new Error('Invalid TianAPI response');
    }
    
    return result.items;
  } catch (error) {
    console.warn(`[API] TianAPI ${category} failed:`, error.message);
    return [];
  }
}

export const getFoodData = async (params = {}) => {
  try {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const apiKey = 'ec7b449dff1e02a2bf6dd10790259747';
    // TianAPI caipu/index doesn't support pagination directly by just 'page' usually, but 'word' is required or it might return random. We'll use a set of words.
    const words = ['肉', '鱼', '虾', '汤', '面', '鸡', '排骨', '牛肉', '豆腐', '鸭'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    
    if (!apiHealth.food) throw new Error('Fast fail');
    const url = `https://apis.tianapi.com/caipu/index?key=${apiKey}&word=${encodeURIComponent(randomWord)}&num=${limit}&page=${page}`;
    const response = await axios.get(url, { timeout: 1500 });
    
    if (response.data?.code !== 200) {
      throw new Error(response.data?.msg || 'Recipe API failed');
    }
    
    const apiData = response.data?.result?.list || [];
    if (apiData.length === 0) throw new Error('Empty array');

    const mappedItems = apiData.map(item => {
      // 1. Image: Bing Thumbnail based on recipe name
      const fallbackKeywords = item.cp_name || '美食';
      const imgUrl = `https://tse2-mm.cn.bing.net/th?q=${encodeURIComponent(fallbackKeywords + ' 高清美食图')}&w=400&h=600&c=7&rs=1&p=0&dpr=1&pid=1.7&mkt=zh-CN&adlt=moderate`;

      // 2. Ingredients parsing
      const rawIng = (item.yuanliao || '') + ' ' + (item.tiaoliao || '');
      const ingArr = rawIng.replace(/；/g, ' ').replace(/;/g, ' ').replace(/、/g, ' ').split(/\s+/).filter(Boolean);
      const ingredients = ingArr.map(ing => ({ name: ing, amount: '' }));
      if (ingredients.length === 0) ingredients.push({ name: '详见做法说明', amount: '' });

      // 3. Steps parsing
      const rawSteps = item.zuofa || '按常规步骤烹饪即可。';
      // Split by digits like 1. 2. 3. or 1、 2、
      let steps = rawSteps.split(/\d+[\.、]/).map(s => s.trim()).filter(Boolean);
      if (steps.length === 0) steps = [rawSteps];

      return {
        id: item.id || Math.random().toString(36).substr(2, 9),
        title: item.cp_name,
        img: imgUrl,
        author: item.type_name ? `${item.type_name}大厨` : '美食家',
        calories: Math.floor(Math.random() * 400 + 100) + ' kcal',
        time: Math.floor(Math.random() * 40 + 10) + ' mins',
        rating: (Math.random() * 1 + 4).toFixed(1), // 4.0 - 5.0
        height: Math.floor(Math.random() * 150) + 250, // For masonry grid
        ingredients: ingredients,
        steps: steps
      };
    });
    
    if (params.page) {
       return { items: mappedItems, total: 500 };
    }
    return mappedItems;
  } catch (error) {
    markApiFailed('food');
    console.warn('[API] Recipe API failed, falling back to local /food...', error);
    const res = await fetchWithFallback('/food', 'food', ['ingredients', 'steps'], params);
    return res;
  }
}
export const getTravelData = async (params = {}) => {
  if (true) return await fetchWithFallback('/travel', 'travel', ['itinerary', 'tips'], params);
  try {
    const page = params.page || 1;
    const limit = params.limit || 12;
    const apiKey = 'ec7b449dff1e02a2bf6dd10790259747';
    
    // Some popular destinations to rotate
    const destinations = [
      '故宫', '长城', '西湖', '兵马俑', '黄山', '张家界', '九寨沟', '泰山', 
      '鼓浪屿', '布达拉宫', '洱海', '玉龙雪山', '莫高窟', '青海湖', '稻城亚丁', 
      '乌镇', '西双版纳', '大理', '桂林', '丽江', '三亚', '香格里拉', '敦煌', '喀纳斯',
      '千岛湖', '峨眉山', '华山', '三清山', '武夷山', '丹霞山', '壶口瀑布', '橘子洲',
      '瘦西湖', '神农架', '五台山', '云台山', '普陀山', '宏村', '平遥古城', '凤凰古城'
    ];
    
    const total = destinations.length;
    const startIndex = (page - 1) * limit;
    let selectedDestinations = destinations.slice(startIndex, startIndex + limit);
    if (selectedDestinations.length === 0) selectedDestinations = destinations.slice(0, limit);
    
    const validScenics = [];
    if (apiHealth.travel) {
      for (const word of selectedDestinations) {
        try {
          const url = `https://apis.tianapi.com/scenic/index?key=${apiKey}&word=${encodeURIComponent(word)}`;
          const res = await axios.get(url, { timeout: 1500 });
          if (res.data?.code === 200 && res.data?.result?.list?.length > 0) {
            validScenics.push(res.data.result.list[0]);
          }
          await new Promise(r => setTimeout(r, 200)); // Delay for QPS
        } catch (err) {
          console.warn(`Failed to fetch scenic ${word}`);
          markApiFailed('travel');
          break;
        }
      }
    }
    
    if (validScenics.length === 0) throw new Error('No valid scenics fetched');

    const mappedItems = validScenics.map((item, index) => {
      let text = (item.content || '').replace(/<[^>]+>/g, '');
      if (text.length > 200) text = text.substring(0, 200) + '...';
      
      const title = item.name;
      const location = `${item.province} · ${item.city}`;
      const imgUrl = `https://tse2-mm.cn.bing.net/th?q=${encodeURIComponent(title + ' 高清风景 摄影')}&w=600&h=800&c=7&rs=1&p=0&dpr=1&pid=1.7&mkt=zh-CN&adlt=moderate`;

      const itinerary = [
        { day: 'Day 1', location: '抵达' + item.city, desc: `抵达${item.city}，办理入住，体验当地特色美食与风土人情。` },
        { day: 'Day 2', location: title + '深度游', desc: `全天游览${title}，核心亮点：${text.substring(0, 40)}...` },
        { day: 'Day 3', location: '周边探索与返程', desc: `在${item.province}周边购买特色纪念品，结束愉快的旅程。` }
      ];
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        img: imgUrl,
        location: location,
        duration: '3 Days',
        title: title,
        text: text,
        itinerary: itinerary,
        tips: [
          `最佳游玩季节建议提前关注${item.city}当地天气预报。`,
          `景区可能会较大，建议穿着舒适的徒步鞋。`,
          `提前在官方渠道购买${title}的门票以避免排队。`
        ]
      };
    });
    
    if (params.page) {
       return { items: mappedItems, total: total };
    }
    return mappedItems;
  } catch (error) {
    console.warn('[API] Travel API failed, falling back to local /travel...', error);
    const res = await fetchWithFallback('/travel', 'travel', ['itinerary', 'tips'], params);
    return res;
  }
}
export const getPhotoData = async (params = {}) => {
  const page = params.page || 1;
  const limit = params.limit || 12;
  const category = params.category || '';

  // 从后端获取照片（数据库 + Bing 实时搜索）
  try {
    const baseUrl = API_BASE_URL || '/api';
    const queryParams = { page, limit };
    if (category && category !== '全部') queryParams.category = category;

    const response = await axios.get(`${baseUrl}/photos`, {
      params: queryParams,
      timeout: 12000,
    });

    const respData = response.data?.data || response.data;
    if (respData && respData.items && respData.items.length > 0) {
      const items = respData.items.map(p => ({
        id: String(p.id || `photo_${Math.random()}`),
        url: p.url || p.thumb || '',
        title: p.title || '',
        category: p.category || '未分类',
        author: p.author || 'Bing图库',
        avatar: p.avatar || '',
        views: p.views || 0,
        likes: p.likes || 0,
        width: p.width || 800,
        height: p.height || 600,
      }));

      return { items, total: respData.total || items.length };
    }

    throw new Error('Empty result');
  } catch (error) {
    console.warn('[Photo] Backend fetch failed, using fallback:', error.message);
    return { items: [], total: 0 };
  }
}
export const getReadingData = async (params = {}) => {
  if (true) return await fetchWithFallback('/reading', 'reading', ['tags'], params);
  try {
    const appKey = '2d0D6cfb0Cc046a1AbE5b9019141E604'; // 万维易源 API Key
    
    // Some popular ISBNs to rotate
    const allIsbns = [
      '9787536692930', // 三体
      '9787544270878', // 解忧杂货店
      '9787208061644', // 追风筝的人
      '9787508647357', // 人类简史
      '9787530215593', // 活着
      '9787115546081', // Python编程
      '9787020002207', // 平凡的世界
      '9787506365437', // 百年孤独
      '9787544253994', // 挪威的森林
      '9787532725698', // 围城
      '9787501602796', // 边城
      '9787530211564', // 撒哈拉的故事
      '9787508655642', // 乔布斯传
      '9787108006721', // 万历十五年
      '9787533936024', // 繁花
      '9787544258609', // 霍乱时期的爱情
      '9787020120611', // 红楼梦
      '9787532156829', // 巨人的陨落
      '9787513324683', // 嫌疑人X的献身
      '9787220100780', // 房思琪的初恋乐园
      '9787539971810', // 梦里花落知多少
      '9787208061645', // 追风筝的人(版2)
      '9787532739343', // 基督山伯爵
      '9787532742916', // 飘
      '9787544242516', // 1Q84
      '9787532732955', // 动物农场
      '9787540455958', // 1984
      '9787505715660', // 局外人
      '9787532133103', // 麦田里的守望者
      '9787532736564', // 月亮和六便士
      '9787544241694', // 白夜行
      '9787539943640', // 盗墓笔记
      '9787550263932', // 岛上书店
      '9787544270878', // 幻夜
      '9787208113145', // 乡土中国
      '9787544246668', // 放学后
      '9787544238535', // 恶意
    ];
    
    // Pick based on pagination or random
    const page = params.page || 1;
    const limit = params.limit || 12;
    const total = allIsbns.length;
    const startIndex = (page - 1) * limit;
    let selectedIsbns = allIsbns.slice(startIndex, startIndex + limit);
    if (selectedIsbns.length === 0) selectedIsbns = allIsbns.slice(0, limit);
    
    const validBooks = [];
    // Fetch sequentially to avoid API concurrency limits (QPS = 1 usually for free)
    if (apiHealth.reading) {
      for (const isbn of selectedIsbns) {
        try {
          const res = await axios.post('https://route.showapi.com/1626-1', 
            new URLSearchParams({ isbn: isbn }).toString(), 
            {
              headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'appKey': appKey 
              },
              timeout: 1500
            }
          );
          if (res.data?.showapi_res_code === 0 && res.data?.showapi_res_body?.data) {
            validBooks.push(res.data.showapi_res_body.data);
          }
          // Artificial delay of 200ms to bypass strict rate limit
          await new Promise(r => setTimeout(r, 200));
        } catch (err) {
          console.warn(`Failed to fetch ISBN ${isbn}`);
          markApiFailed('reading');
          break;
        }
      }
    }
    
    if (validBooks.length === 0) throw new Error('No valid books fetched from ShowAPI');

    const mappedItems = validBooks.map(item => {
      // Create some pseudo tags based on keywords
      const tags = [];
      if (item.publisher) tags.push(item.publisher);
      tags.push(item.pubdate ? item.pubdate.substring(0, 4) + '版' : '经典');
      
      return {
        id: item.isbn || Math.random().toString(36).substr(2, 9),
        title: item.title,
        author: item.author || '佚名',
        cover: item.img || `https://picsum.photos/seed/${item.isbn}/400/600`,
        rating: (Math.random() * 1.5 + 8.0).toFixed(1), // Random 8.0 - 9.5
        summary: item.gist ? item.gist.substring(0, 100) + '...' : '暂无内容简介',
        tags: tags,
        quote: item.gist ? item.gist.substring(0, 50) + '...' : '阅读是一座随身携带的避难所。',
        review: item.gist || '一本非常值得阅读的好书。'
      };
    });
    
    if (params.page) {
       return { items: mappedItems, total: total };
    }
    return mappedItems;
  } catch (error) {
    console.warn('[API] ShowAPI failed, falling back to local /reading...', error);
    const res = await fetchWithFallback('/reading', 'reading', ['tags'], params);
    return res;
  }
}
export const getMusicData = async (params = {}) => {
  // Primary: use local database (backend API or SQLite fallback)
  const localData = await fetchWithFallback('/music', 'music', ['tags', 'desc', 'songs'], params);
  const items = localData?.items || localData;
  if (items && Array.isArray(items) && items.length > 0) {
    return localData;
  }

  // Fallback: TianAPI hot reviews (only if local database is empty)
  try {
    const page = params.page || 1;
    const limit = params.limit || 12;
    const apiKey = 'ec7b449dff1e02a2bf6dd10790259747';

    const validMusic = [];
    if (apiHealth.music) {
      for (let i = 0; i < limit; i++) {
        try {
          const url = `https://apis.tianapi.com/hotreview/index?key=${apiKey}`;
          const res = await axios.get(url, { timeout: 1500 });
          if (res.data?.code === 200 && res.data?.result) {
            validMusic.push(res.data.result);
          }
          await new Promise(r => setTimeout(r, 200));
        } catch (err) {
          console.warn('Failed to fetch hot review');
          markApiFailed('music');
          break;
        }
      }
    }

    if (validMusic.length === 0) throw new Error('No valid music fetched');

    const mappedItems = validMusic.map((item, index) => {
      const songName = item.source ? item.source.replace('《', '').replace('》', '') : '未知单曲';
      const comment = item.content || '一首充满故事的歌';

      const keywords = ['黑胶唱片', 'CD', '网易云', '氛围感', '音乐节', '霓虹灯', '治愈系风景'];
      const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
      const imgUrl = `https://tse2-mm.cn.bing.net/th?q=${encodeURIComponent(songName + ' ' + randomKeyword)}&w=400&h=400&c=7&rs=1&p=0&dpr=1&pid=1.7&mkt=zh-CN&adlt=moderate`;

      const possibleTags = ['华语', '欧美', '日语', '韩语', '流行', '摇滚', '民谣', '电子', '说唱', '古典', '爵士', 'R&B/Soul', '后摇', '清晨', '夜晚', '学习', '工作', '运动', '驾车', '散步', '怀旧', '清新', '治愈', '放松', '孤独', '快乐'];
      const tags = [];
      const numTags = 3;
      for (let i = 0; i < numTags; i++) {
        const randTag = possibleTags[Math.floor(Math.random() * possibleTags.length)];
        if (!tags.includes(randTag)) tags.push(randTag);
      }

      return {
        id: 'music_' + Math.random().toString(36).substr(2, 9),
        title: `《${songName}》`,
        desc: [comment],
        cover: imgUrl,
        creatorName: '网易云热评',
        creatorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(songName)}`,
        tags: tags,
        playCount: Math.floor(Math.random() * 900000) + 10000,
        songs: [
          { title: songName, duration: '03:45', artist: '热评单曲' }
        ]
      };
    });

    if (params.page) {
       return { items: mappedItems, total: 500 };
    }
    return mappedItems;
  } catch (error) {
    console.warn('[API] Music API failed, falling back to local /music...', error);
    // Return local data (even if empty) as last resort
    return localData;
  }
}
const doubanPosters = {
  "肖申克的救赎": "https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg",
  "霸王别姬": "https://image.tmdb.org/t/p/w500/f54hNIiHNINw3JiUJB2XaQl5wCN.jpg",
  "阿甘正传": "https://image.tmdb.org/t/p/w500/Cw4hIUIAmSYfK9QfaUW5igp9La.jpg",
  "泰坦尼克号": "https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg",
  "千与千寻": "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
  "美丽人生": "https://image.tmdb.org/t/p/w500/6tEJnof1DKWPnl5lzkjf0FVv7oB.jpg",
  "星际穿越": "https://image.tmdb.org/t/p/w500/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg",
  "盗梦空间": "https://image.tmdb.org/t/p/w500/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg",
  "楚门的世界": "https://image.tmdb.org/t/p/w500/vuza0WqY239yBXOadKlGwJsZJFE.jpg",
  "忠犬八公的故事": "https://image.tmdb.org/t/p/w500/gnsxWkxWHPXMOAzXvS7aKMSKP0N.jpg",
  "海上钢琴师": "https://image.tmdb.org/t/p/w500/iOcbJ5pxokOPDRgieVDbsFMrCc6.jpg",
  "大话西游": "https://image.tmdb.org/t/p/w500/kU8ZalCfGePxWkEeh080Z2XJZaB.jpg",
  "放牛班的春天": "https://image.tmdb.org/t/p/w500/hUl7gSvkGygyk9wt3zy5NqpC5bb.jpg",
  "疯狂动物城": "https://image.tmdb.org/t/p/w500/hlK0e0wAQ3VLuJcsfIYPvb4JVud.jpg",
  "无间道": "https://image.tmdb.org/t/p/w500/qZomlHsaALUtkFeMDwdYmwS2Pbo.jpg",
  "当幸福来敲门": "https://image.tmdb.org/t/p/w500/lBYOKAMcxIvuk9s9hMuecB9dPBV.jpg",
  "怦然心动": "https://image.tmdb.org/t/p/w500/6zDYFigohwncqFL00MKbFV01dWb.jpg",
  "触不可及": "https://image.tmdb.org/t/p/w500/1QU7HKgsQbGpzsJbJK4pAVQV9F5.jpg",
  "蝙蝠侠": "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
  "教父": "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg"
};

export const getMovieData = async (params = {}) => {
  const page = params.page || 1;
  const limit = params.limit || 12;
  const category = params.category || '全部';

  try {
    // 从后端数据库获取豆瓣电影数据
    const baseUrl = API_BASE_URL || '/api';
    const response = await axios.get(`${baseUrl}/movie`, {
      params: { page, limit, sort: 'id', order: 'desc' },
      timeout: 5000,
    });

    // 响应格式: { code: 200, data: { items: [...], total: N } }
    const respData = response.data?.data || response.data;
    if (respData && respData.items) {
      const items = respData.items.map(m => ({
        id: String(m.id),
        title: m.title,
        originalTitle: m.titleEn || m.title,
        // 用 Bing 搜索电影海报
        cover: `https://tse2-mm.cn.bing.net/th?q=${encodeURIComponent(m.title + ' 电影海报')}&w=400&h=600&c=7&rs=1&p=0&dpr=1&pid=1.7&mkt=zh-CN`,
        thumbnail: m.cover,
        rating: m.rating ? Number(m.rating).toFixed(1) : '暂无',
        synopsis: m.desc || '暂无简介',
        year: m.year || '',
        runtime: m.runtime || '',
        genres: m.tags ? (Array.isArray(m.tags) ? m.tags : JSON.parse(m.tags || '[]')) : [],
        director: m.director || '未知',
        actors: m.actors || [],
        voteCount: m.voteCount || 0,
        tagline: m.quote || '',
      }));

      // 豆瓣列表页不提供分类信息，直接返回全部，前端按评分排序展示
      return {
        items,
        total: respData.total || items.length,
      };
    }

    throw new Error('Invalid response');
  } catch (error) {
    console.warn('[Movie API] Backend fetch failed, using static data:', error.message);
  }

  // 最终降级：返回空列表（让用户知道暂无数据）
  return { items: [], total: 0 };
}
export const getSportsData = async () => {
  return [
    {
      id: 'b1',
      cover: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=600',
      title: '下班后的情绪马杀鸡｜微醺拉伸',
      author: { name: 'Luna_Yoga', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna' },
      tags: ['#情绪马杀鸡', '#瑜伽拉伸'],
      likes: 1240,
      content: '今天被开了一天会，整个人都是紧绷的。回家第一件事就是铺开瑜伽垫，点上香薰，放一首 Lo-Fi 音乐。这套 15 分钟的拉伸真的绝了，做完感觉整个背部都松开了。推荐给每一个肩颈不适的打工人！',
      routine: [
        { name: '猫牛式 (Cat-Cow)', duration: '2 mins' },
        { name: '婴儿式 (Child Pose)', duration: '3 mins' },
        { name: '穿针引线式', duration: '各 1 min' },
        { name: '摊尸式 (Savasana)', duration: '5 mins' }
      ]
    },
    {
      id: 'b2',
      cover: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&q=80&w=600',
      title: '周末去野！城市周边的 10km 越野路线',
      author: { name: '野蛮生长', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Runner' },
      tags: ['#周末去野', '#户外越野', '#OOTD'],
      likes: 856,
      content: '不想再跑柏油马路了，周末就是要去山里吸氧！这条路线有一点点爬升，但登顶后的风景绝对值得。今天穿了新入手的越野鞋，抓地力满分。山顶的微风就是最好的奖牌。',
      routine: [
        { name: '热身：动态拉伸', duration: '5 mins' },
        { name: '林间慢跑', duration: '3 km' },
        { name: '台阶爬升', duration: '1 km' },
        { name: '下坡缓冲', duration: '2 km' }
      ]
    },
    {
      id: 'b3',
      cover: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=600',
      title: '居家核心特训：告别小肚腩',
      author: { name: 'Coach.K', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Coach' },
      tags: ['#居家燃脂', '#核心特训'],
      likes: 3200,
      content: '不需要任何器械，只要一张垫子！这套动作亲测有效，动作之间不休息，保证你的腹肌在燃烧。夏天快到了，是时候把马甲线安排上了！',
      routine: [
        { name: '卷腹 (Crunches)', duration: '4组 x 20次' },
        { name: '俄罗斯挺身', duration: '4组 x 30秒' },
        { name: '平板支撑', duration: '3组 x 1分钟' },
        { name: '死虫式', duration: '3组 x 16次' }
      ]
    },
    {
      id: 'b4',
      cover: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=600',
      title: '公园 20 分钟效应，治愈了我的精神内耗',
      author: { name: 'Anna的日常', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna' },
      tags: ['#公园20分钟', '#慢跑'],
      likes: 450,
      content: '趁着午休时间去楼下公园慢跑了 20 分钟，感觉像重新活了一次。不需要配速，不需要看表，只感受风吹过脸颊的感觉。大自然真的是最好的充电站。',
      routine: [
        { name: '快步走', duration: '5 mins' },
        { name: '慢跑 (Zone 2)', duration: '15 mins' },
        { name: '静态拉伸', duration: '5 mins' }
      ]
    },
    {
      id: 'b5',
      cover: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600',
      title: '早晨唤醒：用 10 分钟开启高能一天',
      author: { name: '晨型人', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Morning' },
      tags: ['#早晨唤醒', '#极简运动'],
      likes: 2100,
      content: '别再赖床了！用这 10 分钟的流瑜伽唤醒身体，比喝两杯冰美式还要管用。整天的工作效率直线飙升，亲测有效！',
      routine: [
        { name: '拜日式 A', duration: '3 遍' },
        { name: '下犬式停留', duration: '1 min' },
        { name: '新月式打开胸腔', duration: '各 30s' }
      ]
    }
  ]
}
export const getFashionData = (params = {}) => fetchWithFallback('/fashion', 'fashion', ['lookbook'], params)

export const searchGlobal = async (q) => {
  if (API_BASE_URL) {
    try {
      const res = await axios.get(`${API_BASE_URL}/search`, { params: { q }, timeout: 1500 })
      return res.data.data || []
    } catch (e) {
      console.warn('Global search API failed, falling back...');
    }
  }
  // Local fallback search logic
  const modules = ['article', 'food', 'travel', 'photo', 'reading', 'music', 'movie', 'fashion']
  let allResults = []
  for (const mod of modules) {
    const rows = await queryLocalDB(`SELECT id, title, "\${mod}" as type FROM \${mod} WHERE title LIKE ?`, [`%\${q}%`])
    allResults = allResults.concat(rows)
  }
  return allResults
}

export const uploadImage = async (file) => {
  if (!API_BASE_URL) throw new Error('API not configured');
  const formData = new FormData();
  formData.append('image', file);
  const response = await axios.post(`${API_BASE_URL}/upload/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
}

export const login = async (username, password, rememberMe = false) => {
  try {
    const baseUrl = API_BASE_URL || '/api';
    const endpoint = '/auth/login';
    const response = await axios.post(`${baseUrl}${endpoint}`, { email: username, password, rememberMe });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    if (error.response && error.response.data) {
       return { code: error.response.status, msg: error.response.data.error || '登录失败' };
    }
    return { code: 500, msg: '网络错误，请确保后端服务已启动' };
  }
}

export const sendVerificationCode = async (email, type = 'register') => {
  try {
    const baseUrl = API_BASE_URL || '/api';
    const endpoint = '/auth/send-code';
    const response = await axios.post(`${baseUrl}${endpoint}`, { email, type });
    return { code: 200, data: response.data, msg: '验证码已发送' };
  } catch (error) {
    console.error('Send code error:', error);
    if (error.response && error.response.data) {
       return { code: error.response.status, msg: error.response.data.error || '发送失败' };
    }
    return { code: 500, msg: '网络错误，请确保后端服务已启动' };
  }
}

export const resetPassword = async (email, code, newPassword) => {
  try {
    const baseUrl = API_BASE_URL || '/api';
    const endpoint = '/auth/reset-password';
    const response = await axios.post(`${baseUrl}${endpoint}`, { email, code, newPassword });
    return { code: 200, data: response.data, msg: '密码重置成功' };
  } catch (error) {
    console.error('Reset password error:', error);
    if (error.response && error.response.data) {
       return { code: error.response.status, msg: error.response.data.error || '重置失败' };
    }
    return { code: 500, msg: '网络错误，请确保后端服务已启动' };
  }
}

export const register = async (username, email, password, code) => {
  try {
    const baseUrl = API_BASE_URL || '/api';
    const endpoint = '/auth/register';
    const response = await axios.post(`${baseUrl}${endpoint}`, { username, email, password, code });
    return { code: 200, data: response.data, msg: '注册成功' };
  } catch (error) {
    console.error('Register error:', error);
    if (error.response && error.response.data) {
       return { code: error.response.status, msg: error.response.data.error || '注册失败' };
    }
    return { code: 500, msg: '网络错误，请确保后端服务已启动' };
  }
}

export const scrapeArticle = async (url) => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const response = await axios.get(`${baseUrl}/scrape`, { params: { url } });
    return response.data;
  } catch (error) {
    console.error('Scrape error:', error);
    return { content: null, error: '提取失败，请访问原文' };
  }
}

// History APIs
export const addHistory = async (data) => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const token = localStorage.getItem('token') || localStorage.getItem('mockToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(`${baseUrl}/history`, data, { headers });
    return response.data;
  } catch (error) {
    console.error('Add history error:', error);
    return null;
  }
}

export const getHistory = async (params = { page: 1, limit: 20 }) => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const token = localStorage.getItem('token') || localStorage.getItem('mockToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`${baseUrl}/history`, { params, headers });
    return response.data.data; // paginate returns { items, total, ... }
  } catch (error) {
    console.error('Get history error:', error);
    return { items: [], total: 0 };
  }
}

export const clearHistory = async () => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const token = localStorage.getItem('token') || localStorage.getItem('mockToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.delete(`${baseUrl}/history`, { headers });
    return response.data;
  } catch (error) {
    console.error('Clear history error:', error);
    return null;
  }
}

export const deleteHistory = async (id) => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const token = localStorage.getItem('token') || localStorage.getItem('mockToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.delete(`${baseUrl}/history/${id}`, { headers });
    return response.data;
  } catch (error) {
    console.error('Delete history error:', error);
    return null;
  }
}

export const chatWithAI = async (messages, systemPrompt = '') => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const token = localStorage.getItem('token') || localStorage.getItem('mockToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(`${baseUrl}/ai/chat`, { messages, systemPrompt }, { headers });
    return response.data?.data?.reply || null;
  } catch (error) {
    console.error('AI chat error:', error);
    return null;
  }
}

export const getUserProfile = async () => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const token = localStorage.getItem('token') || localStorage.getItem('mockToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`${baseUrl}/users/me`, { headers });
    return response.data;
  } catch (error) {
    console.error('Get user profile error:', error);
    return null;
  }
}

export const updateUserProfile = async (data) => {
  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    const token = localStorage.getItem('token') || localStorage.getItem('mockToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.put(`${baseUrl}/users/me`, data, { headers });
    return response.data;
  } catch (error) {
    console.error('Update user profile error:', error);
    return null;
  }
}

// --- Music / NetEase APIs ---

export const searchMusic = async (keyword, limit = 10) => {
  try {
    const baseUrl = API_BASE_URL || '/api';
    const response = await axios.get(`${baseUrl}/music/search`, { params: { keyword, limit } });
    return response.data.data || [];
  } catch (error) {
    console.error('Music search error:', error);
    return [];
  }
}

export const searchAndSaveMusic = async (keyword) => {
  try {
    const baseUrl = API_BASE_URL || '/api';
    const response = await axios.post(`${baseUrl}/music/search-and-save`, { keyword });
    return response.data.data || null;
  } catch (error) {
    console.error('Music search-and-save error:', error);
    return null;
  }
}

export const getSongUrl = async (neteaseId) => {
  try {
    const baseUrl = API_BASE_URL || '/api';
    const response = await axios.get(`${baseUrl}/music/song-url/${neteaseId}`);
    return response.data.data?.url || null;
  } catch (error) {
    console.error('Get song URL error:', error);
    return null;
  }
}

export const refreshSongUrl = async (neteaseId) => {
  try {
    const baseUrl = API_BASE_URL || '/api';
    const response = await axios.post(`${baseUrl}/music/refresh-url/${neteaseId}`);
    return response.data.data?.url || null;
  } catch (error) {
    console.error('Refresh song URL error:', error);
    return null;
  }
}

export const getSavedSongs = async (page = 1, limit = 20) => {
  try {
    const baseUrl = API_BASE_URL || '/api';
    const response = await axios.get(`${baseUrl}/music/saved`, { params: { page, limit } });
    return response.data.data || { items: [], total: 0 };
  } catch (error) {
    console.error('Get saved songs error:', error);
    return { items: [], total: 0 };
  }
}

// --- Comments API ---
const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('mockToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getComments = async (module, itemId, page = 1, limit = 20) => {
  try {
    const baseUrl = API_BASE_URL || '/api';
    const response = await axios.get(`${baseUrl}/interaction/comments/${module}/${itemId}`, {
      params: { page, limit },
      headers: getAuthHeaders()
    });
    return response.data.data || { items: [], total: 0 };
  } catch (error) {
    console.error('Get comments error:', error);
    return { items: [], total: 0 };
  }
}

export const addComment = async (module_name, item_id, content) => {
  try {
    const baseUrl = API_BASE_URL || '/api';
    const response = await axios.post(`${baseUrl}/interaction/comments`,
      { module_name, item_id, content },
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Add comment error:', error);
    if (error.response && error.response.data) {
      return { code: error.response.status, msg: error.response.data.error || '评论失败' };
    }
    return { code: 500, msg: '网络错误' };
  }
}

export const deleteComment = async (commentId) => {
  try {
    const baseUrl = API_BASE_URL || '/api';
    const response = await axios.delete(`${baseUrl}/interaction/comments/${commentId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Delete comment error:', error);
    return { code: 500, msg: '删除失败' };
  }
}

// --- Movie Reviews (TMDB + fallback) ---
export const getMovieReviews = async (movieId, page = 1) => {
  try {
    // Use relative path to go through Vite proxy (avoids CORS)
    const response = await axios.get(`/api/movie/${movieId}/reviews`, {
      params: { page },
      timeout: 10000
    });
    return response.data.data || { items: [], total: 0 };
  } catch (error) {
    console.error('Get movie reviews error:', error);
    return { items: [], total: 0 };
  }
}
