<template>
  <div class="reading-board">
    <div class="r-header">
      <h2>Curated Bookshelf 📚</h2>
      <p>在文字的世界里，寻找跨越时空的共鸣。</p>
    </div>

    <div class="book-list" v-if="displayData.length > 0">
      <div v-for="item in displayData" :key="item.id" class="book-card" @click="openBook(item)">
        <div class="book-cover">
          <img :src="item.cover" :alt="item.title" loading="lazy" />
          <div class="book-rating">{{ item.rating }}</div>
          <div class="fav-btn" :class="{ active: isFavorited('reading', item.id) }" @click.stop="toggleFavorite('reading', item.id)">
            <el-icon><StarFilled /></el-icon>
          </div>
        </div>
        <div class="book-info">
          <h3>{{ item.title }}</h3>
          <p class="author">By {{ item.author }}</p>
          <p class="summary">{{ item.summary }}</p>
          <div class="r-tags">
            <span v-for="tag in item.tags.slice(0, 2)" :key="tag">{{ tag }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>暂无内容，快去阅读好书吧！</p>
    </div>

    
    <div class="pagination-wrap" v-if="totalItems > 0 && !props.items">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalItems"
        layout="prev, pager, next"
        background
        @current-change="handlePageChange"
      />
    </div>

    <!-- Reading Review Dialog -->
    <el-dialog v-model="showBook" width="880px" class="reading-dialog" append-to-body destroy-on-close>
      <div v-if="currentBook" class="reading-detail-layout">
        <div class="r-left">
          <div class="r-cover-wrapper">
            <img :src="currentBook.cover" :alt="currentBook.title" />
          </div>
          <div class="r-book-meta">
            <h2>{{ currentBook.title }}</h2>
            <div class="r-author">{{ currentBook.author }}</div>
            <div class="r-stars">
              <el-icon v-for="i in 5" :key="i"><StarFilled /></el-icon>
              <span>{{ currentBook.rating }} / 10</span>
            </div>
            <div class="r-tags-full">
              <span v-for="tag in currentBook.tags" :key="tag">{{ tag }}</span>
            </div>
          </div>
        </div>

        <div class="r-right">
          <div class="r-quote-box">
            <el-icon class="quote-icon"><ChatLineSquare /></el-icon>
            <p>{{ currentBook.quote }}</p>
          </div>
          
          <div class="r-review-content">
            <h3>📖 读书笔记</h3>
            <p>{{ currentBook.review }}</p>
          </div>
          
          <div class="r-actions">
            <el-button type="primary" color="#3e2723" round>加入想读清单</el-button>
            <el-button plain round>分享书评</el-button>
            <el-button 
              :type="isFavorited('reading', currentBook.id) ? 'danger' : 'default'"
              @click="toggleFavorite('reading', currentBook.id)"
              round
            >
              <el-icon style="margin-right: 4px"><StarFilled v-if="isFavorited('reading', currentBook.id)" /><Star v-else /></el-icon>
              {{ isFavorited('reading', currentBook.id) ? '已收藏' : '收藏笔记' }}
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed , onMounted} from 'vue'
import { StarFilled, Star, ChatLineSquare } from '@element-plus/icons-vue'
import { getReadingData, addHistory } from '@/api/index.js'
import { toggleFavorite, isFavorited } from '@/store/favorites.js'

const props = defineProps({
  items: {
    type: Array,
    default: () => null
  }
})

const localData = ref([])
const loading = ref(false)
const displayData = computed(() => props.items || localData.value)


const currentPage = ref(1)
const pageSize = ref(12)
const totalItems = ref(0)

const loadData = async () => {
  if (!props.items) {
    loading.value = true
    try {
      const res = await getReadingData({ page: currentPage.value, limit: pageSize.value })
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
})

const showBook = ref(false)
const currentBook = ref(null)

const openBook = (item) => {
  currentBook.value = item
  showBook.value = true
  addHistory({ module_name: 'reading', item_id: String(item.id), title: item.title, cover: item.cover || item.image });
}
</script>

<style scoped>
.reading-board {
  max-width: 1100px;
  margin: 0 auto;
  padding-bottom: 60px;
}

.r-header {
  text-align: center;
  margin-bottom: 60px;
  padding: 40px 0;
  border-bottom: 1px solid #eaeaea;
}
.r-header h2 {
  font-family: 'Georgia', serif;
  font-size: 36px;
  color: #2c3e50;
  margin: 0 0 16px 0;
}
.r-header p {
  color: #7f8c8d;
  font-size: 16px;
  margin: 0;
  letter-spacing: 2px;
}

.book-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 40px;
}

.book-card {
  display: flex;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  gap: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #f5f5f5;
}
.book-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
}

.book-cover {
  width: 140px;
  height: 200px;
  flex-shrink: 0;
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 4px 4px 15px rgba(0,0,0,0.15);
}
.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.book-rating {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0,0,0,0.7);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.fav-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(255,255,255,0.8);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 2;
}
.fav-btn:hover { background: #fff; transform: scale(1.1); }
.fav-btn.active { color: #fc3c44; }

.empty-state { text-align: center; padding: 60px 0; color: #999; grid-column: 1 / -1; }

.book-info {
  display: flex;
  flex-direction: column;
}
.book-info h3 {
  font-size: 22px;
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-family: 'Georgia', serif;
}
.author {
  color: #e67e22;
  font-size: 14px;
  margin: 0 0 16px 0;
  font-weight: 500;
}
.summary {
  color: #7f8c8d;
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 20px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.r-tags {
  display: flex;
  gap: 8px;
  margin-top: auto;
}
.r-tags span {
  background: #f8f9fa;
  color: #95a5a6;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
}

/* Reading Dialog */
:deep(.reading-dialog) {
  border-radius: 16px;
  overflow: hidden;
  padding: 0;
  background: #faf8f5; /* 暖纸色纸张质感 */
}
:deep(.reading-dialog .el-dialog__header) { display: none; }
:deep(.reading-dialog .el-dialog__body) { padding: 0; }

.reading-detail-layout {
  display: flex;
  height: 600px;
}

.r-left {
  width: 35%;
  background: #3e2723; /* 深棕色像木质书架 */
  padding: 50px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: #fff;
}
.r-cover-wrapper {
  width: 180px;
  height: 260px;
  box-shadow: -5px 10px 30px rgba(0,0,0,0.5);
  margin-bottom: 30px;
  border-radius: 4px;
  overflow: hidden;
}
.r-cover-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.r-book-meta h2 {
  font-family: 'Georgia', serif;
  font-size: 26px;
  margin: 0 0 10px 0;
}
.r-author {
  color: #d7ccc8;
  font-size: 14px;
  margin-bottom: 20px;
  letter-spacing: 1px;
}
.r-stars {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #f39c12;
  margin-bottom: 24px;
}
.r-stars span {
  color: #fff;
  margin-left: 8px;
  font-weight: bold;
}
.r-tags-full {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
.r-tags-full span {
  background: rgba(255,255,255,0.1);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.r-right {
  width: 65%;
  padding: 50px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.r-quote-box {
  position: relative;
  background: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  margin-bottom: 40px;
}
.quote-icon {
  position: absolute;
  top: -15px;
  left: 20px;
  font-size: 30px;
  color: #e67e22;
  background: #faf8f5;
  padding: 0 10px;
}
.r-quote-box p {
  font-family: 'Kaiti', 'STKaiti', serif; /* 楷体更适合引语 */
  font-size: 18px;
  color: #555;
  line-height: 1.8;
  margin: 0;
  font-style: italic;
}

.r-review-content h3 {
  font-size: 20px;
  color: #2c3e50;
  margin-bottom: 20px;
  border-bottom: 2px solid #eaeaea;
  padding-bottom: 10px;
}
.r-review-content p {
  font-family: 'Georgia', 'Songti SC', serif;
  font-size: 16px;
  line-height: 2;
  color: #34495e;
  text-align: justify;
}

.r-actions {
  margin-top: auto;
  padding-top: 40px;
  display: flex;
  gap: 16px;
}

@media (max-width: 900px) {
  .book-list { grid-template-columns: 1fr; }
  .reading-detail-layout { flex-direction: column; height: auto; }
  .r-left, .r-right { width: 100%; }
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 30px 0;
  width: 100%;
}
</style>
