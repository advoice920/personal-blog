const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '../src/views/Home/components');
const boards = ['FoodBoard', 'TravelBoard', 'PhotoBoard', 'ReadingBoard', 'FashionBoard', 'SportsBoard', 'MovieBoard', 'MusicBoard'];

boards.forEach(board => {
  const filePath = path.join(componentsDir, `${board}.vue`);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  const category = board.replace('Board', '');
  
  // Replace the mock import with API import
  content = content.replace(/import \{ .* \} from '@\/mock\/.*\.js'/g, `import { get${category}Data } from '@/api/index.js'`);
  
  // Ensure onMounted is imported
  if (!content.includes('onMounted')) {
    content = content.replace(/import {([^}]+)} from 'vue'/, (match, p1) => {
      return `import {${p1}, onMounted} from 'vue'`;
    });
  }
  
  const computedRegex = /const displayData = computed\(\(\) => props\.items \|\| [a-zA-Z0-9_]+\)/g;
  
  content = content.replace(computedRegex, 
`const localData = ref([])
const loading = ref(false)
const displayData = computed(() => props.items || localData.value)

onMounted(async () => {
  if (!props.items) {
    loading.value = true
    try {
      localData.value = await get${category}Data()
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }
})`);

  fs.writeFileSync(filePath, content);
  console.log(`Refactored ${board}.vue`);
});
