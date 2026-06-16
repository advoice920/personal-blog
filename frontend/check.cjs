const fs = require('fs');
const path = require('path');
const dir = 'E:/AIproject/bloger_backup/frontend/src/views/Home/components';
['TravelBoard.vue', 'FoodBoard.vue', 'FashionBoard.vue', 'SportsBoard.vue', 'PhotoBoard.vue', 'ReadingBoard.vue', 'MovieBoard.vue'].forEach(f => {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) return;
  const content = fs.readFileSync(p, 'utf8');
  const imgRegex = /<img\s+:src=\"([^"]+)\"/g;
  let match;
  console.log('--- ' + f + ' ---');
  while ((match = imgRegex.exec(content)) !== null) {
    console.log(match[1]);
  }
});
