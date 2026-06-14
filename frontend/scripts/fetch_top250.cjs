const https = require('https');
const fs = require('fs');

https.get('https://movie.douban.com/top250', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'
  }
}, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const map = {};
    const regex = /<img width="100" alt="(.*?)" src="(.*?)" class=""/g;
    let match;
    while ((match = regex.exec(data)) !== null) {
      let title = match[1];
      let url = match[2];
      // replace s_ratio_poster or whatever with s_ratio_poster or keep it
      map[title] = url;
    }
    fs.writeFileSync('douban_top250.json', JSON.stringify(map, null, 2));
    console.log('Done.');
  });
}).on('error', err => {
  console.log('Error:', err);
});
