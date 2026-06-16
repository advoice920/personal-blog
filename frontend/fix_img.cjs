const fs = require('fs');
const path = require('path');
const dir = 'E:/AIproject/bloger_backup/frontend/src/views/Home/components';

function fixFile(file) {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');
  let originalEnding = content.includes('\r\n') ? '\r\n' : '\n';
  content = content.replace(/\r\n/g, '\n');
  
  if (content.includes('cover: item.cover || item.image')) {
    content = content.replace(/cover: item\.cover \|\| item\.image/g, 'cover: item.img || item.cover || item.image');
    content = content.replace(/\n/g, originalEnding);
    fs.writeFileSync(p, content);
    console.log('Fixed img fallback in ' + file);
  }
}

fixFile('TravelBoard.vue');
fixFile('FoodBoard.vue');
fixFile('FashionBoard.vue');

// Also fix FoodBoard which uses "recipe" parameter
function fixFood(file) {
  const p = path.join(dir, file);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');
  let originalEnding = content.includes('\r\n') ? '\r\n' : '\n';
  content = content.replace(/\r\n/g, '\n');
  
  if (content.includes('cover: recipe.cover || recipe.image')) {
    content = content.replace(/cover: recipe\.cover \|\| recipe\.image/g, 'cover: recipe.img || recipe.cover || recipe.image');
    content = content.replace(/\n/g, originalEnding);
    fs.writeFileSync(p, content);
    console.log('Fixed img fallback in ' + file);
  }
}

fixFood('FoodBoard.vue');
