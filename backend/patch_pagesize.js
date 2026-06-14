const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../frontend/src/views/Home/components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('Board.vue'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Change pageSize to 12
  content = content.replace(/const pageSize = ref\(\d+\)/g, 'const pageSize = ref(12)');

  fs.writeFileSync(filePath, content);
  console.log(`Updated pageSize to 12 in ${file}`);
}
