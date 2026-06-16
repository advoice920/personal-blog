const https = require('https');
const fs = require('fs');

const movies = [
  '宇宙探索编辑部', '小偷家族', '肖申克的救赎', '千与千寻', '星际穿越',
  '霸王别姬', '泰坦尼克号', '盗梦空间', '阿甘正传', '楚门的世界',
  '海上钢琴师', '无间道', '搏击俱乐部', '美丽人生', '当幸福来敲门',
  '辛德勒的名单', '寻梦环游记', '绿皮书', '放牛班的春天', '龙猫'
];

const map = {};

async function fetchBaike(title) {
  return new Promise(resolve => {
    // try to fetch the baike page
    https.get('https://baike.baidu.com/item/' + encodeURIComponent(title), { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        const match = data.match(/<meta property="og:image" content="(https:\/\/bkimg\.cdn\.bcebos\.com[^"]+)"/);
        if (match) {
          resolve(match[1]);
        } else {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function run() {
  for (const m of movies) {
    let img = await fetchBaike(m + '电影'); // search for the movie specifically
    if (!img) {
      img = await fetchBaike(m);
    }
    if (img) {
      map[m] = img;
      console.log(`Found: ${m} -> ${img}`);
    } else {
      console.log(`Not found: ${m}`);
    }
    await new Promise(r => setTimeout(r, 200));
  }
  fs.writeFileSync('baike_posters.json', JSON.stringify(map, null, 2));
  console.log('Done.');
}

run();
