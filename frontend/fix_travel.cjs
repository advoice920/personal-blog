const fs = require('fs');
const path = require('path');
const p = 'E:/AIproject/bloger_backup/frontend/src/views/Home/components/TravelBoard.vue';

let content = fs.readFileSync(p, 'utf8');
let originalEnding = content.includes('\r\n') ? '\r\n' : '\n';
content = content.replace(/\r\n/g, '\n');

if (content.includes('cover: travel.cover || travel.image')) {
  content = content.replace(/cover: travel\.cover \|\| travel\.image/g, 'cover: travel.img || travel.cover || travel.image');
  content = content.replace(/\n/g, originalEnding);
  fs.writeFileSync(p, content);
  console.log('Fixed img fallback in TravelBoard.vue');
}
