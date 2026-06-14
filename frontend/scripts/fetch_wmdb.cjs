const https = require('https');
const fs = require('fs');

const movies = [
  '宇宙探索编辑部', '小偷家族', '肖申克的救赎', '千与千寻', '星际穿越',
  '霸王别姬', '泰坦尼克号', '盗梦空间', '阿甘正传', '楚门的世界',
  '海上钢琴师', '无间道', '搏击俱乐部', '美丽人生', '当幸福来敲门',
  '辛德勒的名单', '寻梦环游记', '绿皮书', '放牛班的春天', '龙猫'
];

const map = {};

async function fetchMovie(title) {
  return new Promise(resolve => {
    https.get('https://api.wmdb.tv/api/v1/movie/search?q=' + encodeURIComponent(title), res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.data && json.data[0] && json.data[0].data && json.data[0].data[0].poster) {
            resolve(json.data[0].data[0].poster);
            return;
          }
        } catch (e) {}
        resolve(null);
      });
    }).on('error', () => resolve(null));
  });
}

async function run() {
  for (const m of movies) {
    const poster = await fetchMovie(m);
    if (poster) {
      map[m] = poster;
      console.log(`Found: ${m} -> ${poster}`);
    } else {
      console.log(`Not found: ${m}`);
    }
    // Sleep a bit to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }
  fs.writeFileSync('movie_posters_wmdb.json', JSON.stringify(map, null, 2));
  console.log('Done.');
}

run();
