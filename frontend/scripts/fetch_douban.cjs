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
  const url = 'https://m.douban.com/rexxar/api/v2/search?type=movie&q=' + encodeURIComponent(m);
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X)', 'Referer': 'https://m.douban.com/' } }, res => {
    let data = '';
    res.on('data', d => data += d);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.subjects && json.subjects[0] && json.subjects[0].pic && json.subjects[0].pic.normal) {
          map[m] = json.subjects[0].pic.normal;
          console.log(`Found: ${m}`);
        } else {
          console.log(`No pic for: ${m}`);
        }
      } catch (e) {
        console.log(`Error parsing: ${m}`);
      }
      count++;
      if (count === movies.length) {
        fs.writeFileSync('douban_posters.json', JSON.stringify(map, null, 2));
        console.log('Done.');
      }
    });
  });
});
