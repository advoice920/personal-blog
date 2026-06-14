const https = require('https');
const fs = require('fs');

const movies = {
  "宇宙探索编辑部": "35267208",
  "小偷家族": "27622447",
  "肖申克的救赎": "1292052",
  "千与千寻": "1291561",
  "星际穿越": "1889243",
  "霸王别姬": "1291546",
  "泰坦尼克号": "1292722",
  "盗梦空间": "3541415",
  "阿甘正传": "1292720",
  "楚门的世界": "1292064",
  "海上钢琴师": "1292001",
  "无间道": "1302425",
  "搏击俱乐部": "1292000",
  "美丽人生": "1292063",
  "当幸福来敲门": "1849031",
  "辛德勒的名单": "1295644",
  "寻梦环游记": "20495023",
  "绿皮书": "27060077",
  "放牛班的春天": "1292849",
  "龙猫": "1291560"
};

const map = {};

async function fetchDoubanM(title, id) {
  return new Promise(resolve => {
    https.get('https://m.douban.com/movie/subject/' + id + '/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
      }
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        // extract cover image
        // m.douban.com uses <img src="https://img9.doubanio.com/view/photo/m_ratio_poster/public/pXXX.webp"
        const match = data.match(/https:\/\/img[0-9]\.doubanio\.com\/view\/photo\/(m_ratio_poster|s_ratio_poster)\/public\/(p[^"']+)/);
        if (match) {
          // normalize to s_ratio_poster
          resolve(`https://img9.doubanio.com/view/photo/s_ratio_poster/public/${match[2]}`);
        } else {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function run() {
  for (const title in movies) {
    const poster = await fetchDoubanM(title, movies[title]);
    if (poster) {
      map[title] = poster;
      console.log(`Found: ${title} -> ${poster}`);
    } else {
      console.log(`Not found: ${title}`);
    }
    await new Promise(r => setTimeout(r, 800));
  }
  fs.writeFileSync('douban_m_posters.json', JSON.stringify(map, null, 2));
  console.log('Done.');
}

run();
