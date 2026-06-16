const https = require('https');
const fs = require('fs');

const movies = [
  '宇宙探索编辑部', '小偷家族', '肖申克的救赎', '千与千寻', '星际穿越',
  '霸王别姬', '泰坦尼克号', '盗梦空间', '阿甘正传', '楚门的世界',
  '海上钢琴师', '无间道', '搏击俱乐部', '美丽人生', '当幸福来敲门',
  '辛德勒的名单', '寻梦环游记', '绿皮书', '放牛班的春天', '龙猫'
];

const map = {};
let count = 0;

movies.forEach(m => {
  const url = 'https://image.baidu.com/search/index?tn=baiduimage&word=' + encodeURIComponent(m + ' 电影海报');
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } }, res => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      const match = data.match(/"thumbURL":"(.*?)"/);
      if (match) {
        map[m] = match[1];
        console.log(`Found: ${m} -> ${match[1]}`);
      } else {
        console.log(`Not found for: ${m}`);
      }
      count++;
      if (count === movies.length) {
        fs.writeFileSync('movie_posters_baidu.json', JSON.stringify(map, null, 2));
        console.log('Done.');
      }
    });
  }).on('error', err => {
    console.log('Error fetching ' + m + ':', err.message);
    count++;
  });
});
