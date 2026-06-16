const https = require('https');
const fs = require('fs');

const movies = [
  '宇宙探索编辑部', '小偷家族', '肖申克的救赎', '千与千寻', '星际穿越',
  '霸王别姬', '泰坦尼克号', '盗梦空间', '阿甘正传', '楚门的世界',
  '海上钢琴师', '无间道', '搏击俱乐部', '美丽人生', '当幸福来敲门',
  '辛德勒的名单', '寻梦环游记', '绿皮书', '放牛班的春天', '龙猫'
];

const map = {};

async function fetchDoubanHTML(title) {
  return new Promise(resolve => {
    https.get('https://search.douban.com/movie/subject_search?search_text=' + encodeURIComponent(title), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
      }
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        const match = data.match(/window\.__DATA__ = (\{.*?\});/);
        if (match) {
          try {
            const json = JSON.parse(match[1]);
            // find items
            if (json.items && json.items.length > 0) {
               for(let item of json.items) {
                  if (item.title && item.title.includes(title) && item.pic && item.pic.normal) {
                     resolve(item.pic.normal);
                     return;
                  }
               }
            }
          } catch(e) {}
        }
        resolve(null);
      });
    }).on('error', () => resolve(null));
  });
}

async function run() {
  for (const m of movies) {
    const poster = await fetchDoubanHTML(m);
    if (poster) {
      map[m] = poster;
      console.log(`Found: ${m} -> ${poster}`);
    } else {
      console.log(`Not found: ${m}`);
    }
    await new Promise(r => setTimeout(r, 800));
  }
  fs.writeFileSync('douban_search.json', JSON.stringify(map, null, 2));
  console.log('Done.');
}

run();
