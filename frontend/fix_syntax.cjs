const fs = require('fs');
const path = require('path');
const dir = 'E:/AIproject/bloger_backup/frontend/src/views/Home/components';

function fixFile(file, replaces) {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');
  let originalEnding = content.includes('\r\n') ? '\r\n' : '\n';
  content = content.replace(/\r\n/g, '\n');
  
  let patched = false;
  replaces.forEach(r => {
    if (content.includes(r.from)) {
      content = content.replace(r.from, r.to);
      patched = true;
    }
  });
  if (patched) {
    content = content.replace(/\n/g, originalEnding);
    fs.writeFileSync(p, content);
    console.log('Fixed ' + file);
  }
}

fixFile('SportsBoard.vue', [
  { from: 'showPost.value = true  addHistory', to: 'showPost.value = true;\n  addHistory' }
]);

fixFile('FashionBoard.vue', [
  { from: `  addHistory({ module_name: 'fashion', item_id: String(item.id), title: item.title, cover: item.cover || item.image });\n  addHistory({ module_name: 'fashion', item_id: String(item.id), title: item.title, cover: item.cover });`, 
    to: `  addHistory({ module_name: 'fashion', item_id: String(item.id), title: item.title, cover: item.cover || item.image });` }
]);

fixFile('ReadingBoard.vue', [
  { from: `  addHistory({ module_name: 'reading', item_id: String(item.id), title: item.title, cover: item.cover || item.image });\n  addHistory({ module_name: 'reading', item_id: String(item.id), title: item.title, cover: item.cover });`, 
    to: `  addHistory({ module_name: 'reading', item_id: String(item.id), title: item.title, cover: item.cover || item.image });` }
]);
