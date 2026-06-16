const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../frontend/src/views/Home/components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('Board.vue'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already paginated
  if (content.includes('v-model:current-page="currentPage"')) {
    console.log(`Skipping ${file}`);
    continue;
  }

  // 1. Add pagination HTML before the closing tag of the root div OR before the dialogs
  // We'll insert it right after the main grid/list
  const htmlToInsert = `
    <div class="pagination-wrap" v-if="totalItems > 0 && !props.items">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalItems"
        layout="prev, pager, next"
        background
        @current-change="handlePageChange"
      />
    </div>`;
    
  if (content.includes('<el-dialog')) {
    content = content.replace(/(\s*)(<!-- .*Dialog -->\s*<el-dialog)/, `$1${htmlToInsert}$1$2`);
  } else {
    // If no dialog, insert before the last </div> in template
    content = content.replace(/(\s*)(<\/div>\s*<\/template>)/, `$1${htmlToInsert}$1$2`);
  }

  // 2. Update the script setup imports to include watch
  content = content.replace(/import { ref, computed(.*?) } from 'vue'/, "import { ref, computed, watch$1 } from 'vue'");
  if (!content.includes('watch')) {
      content = content.replace(/import { ref, computed(.*?) } from 'vue'/, "import { ref, computed, watch$1 } from 'vue'");
  }

  // 3. Replace the onMounted block with pagination logic
  const matchAPI = content.match(/await (get[A-Za-z]+Data)\(\)/);
  if (matchAPI) {
    const apiName = matchAPI[1];
    const scriptReplacement = `
const currentPage = ref(1)
const pageSize = ref(8)
const totalItems = ref(0)

const loadData = async () => {
  if (!props.items) {
    loading.value = true
    try {
      const res = await ${apiName}({ page: currentPage.value, limit: pageSize.value })
      localData.value = res.items || res
      totalItems.value = res.total || (res.items ? res.items.length : res.length) || 0
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }
}

const handlePageChange = (val) => {
  currentPage.value = val
  loadData()
}

onMounted(() => {
  loadData()
})`;

    content = content.replace(/onMounted\(async \(\) => \{[\s\S]*?\}\)/, scriptReplacement);
  }

  // 4. Add pagination styles
  const styleAppend = `
.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 30px 0;
  width: 100%;
}
</style>`;
  content = content.replace(/<\/style>/, styleAppend);

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}
