<template>
  <div class="photo-board">
    <!-- Top Filter Bar -->
    <div class="photo-filter-bar">
      <div class="filter-left">
        <span 
          v-for="tab in ['热门', '排名上升', '新作', '编辑推荐', '影集', '专栏']" 
          :key="tab"
          class="filter-link" 
          :class="{ active: activeTab === tab }"
          @click="activeTab = tab"
        >{{ tab }}</span>
      </div>
      <div class="filter-right">
        <el-popover placement="bottom-start" :width="320" trigger="hover">
          <template #reference>
            <span class="dropdown-link" style="font-weight: 500; color: #333;">{{ activeCategory === 'all' ? '全部分类' : activeCategory }} <el-icon><ArrowDown /></el-icon></span>
          </template>
          <div class="category-popover">
            <h4 class="popover-title" @click="activeCategory = 'all'" :class="{ active: activeCategory === 'all' }">全部分类</h4>
            <div class="category-grid">
              <span 
                v-for="cat in subCategories" 
                :key="cat"
                class="cat-item"
                :class="{ active: activeCategory === cat }"
                @click="activeCategory = cat"
              >{{ cat }}</span>
            </div>
          </div>
        </el-popover>
        <span class="dropdown-link">全幅摄影师 <el-icon><ArrowDown /></el-icon></span>
        <span class="dropdown-link">热度排序 <el-icon><ArrowDown /></el-icon></span>
      </div>
    </div>

    <!-- Justified Photo Grid -->
    <div class="photo-gallery">
      <div 
        v-for="photo in filteredPhotos" 
        :key="photo.id" 
        class="photo-item"
        :style="{ flexGrow: (photo.width / photo.height) }"
        @dblclick="openPreview(photo)"
      >
        <img :src="photo.url" :alt="photo.title" loading="lazy" />
        <div class="photo-overlay">
          <div class="overlay-top">
            <span class="photo-title">{{ photo.title }}</span>
          </div>
          <div class="overlay-bottom">
            <div class="author-info">
              <el-avatar :size="24" :src="photo.avatar" />
              <span class="author-name">{{ photo.author }}</span>
            </div>
            <div class="photo-stats">
              <span><el-icon><View /></el-icon> {{ photo.views }}</span>
              <span 
                class="fav-btn" 
                :class="{ active: isFavorited('photo', photo.id) }" 
                @click.stop="toggleFavorite('photo', photo.id)"
                style="pointer-events: auto; cursor: pointer;"
              >
                <el-icon><StarFilled /></el-icon> {{ photo.likes }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Image Previewer -->
    <el-image-viewer
      v-if="showViewer"
      :url-list="[currentPreviewUrl]"
      @close="closePreview"
      teleported
    />
  
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
  </div>
</template>

<script setup>
import { ref, computed , onMounted} from 'vue'
import { ArrowDown, View, Star, StarFilled } from '@element-plus/icons-vue'
import { ElImageViewer } from 'element-plus'
import { getPhotoData, addHistory } from '@/api/index.js'
import { toggleFavorite, isFavorited } from '@/store/favorites.js'

const props = defineProps({
  items: {
    type: Array,
    default: () => null
  }
})

const activeTab = ref('热门')
const activeCategory = ref('all')

const subCategories = [
  '未分类', '动物',
  '黑白', '城市风光',
  '时尚', '极简抽象',
  '植物', '微距',
  '肖像', '舞台演出',
  '静物（美食）', '水下',
  '建筑', '自然风光',
  '人文纪实', '航拍',
  '夜景'
]

const localData = ref([])
const loading = ref(false)


const currentPage = ref(1)
const pageSize = ref(12)
const totalItems = ref(0)

const loadData = async () => {
  if (!props.items) {
    loading.value = true
    try {
      const res = await getPhotoData({ page: currentPage.value, limit: pageSize.value })
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

const filteredPhotos = computed(() => {
  let result = props.items || localData.value
  if (activeCategory.value !== 'all') {
    result = result.filter(p => p.category === activeCategory.value)
  }
  return result
})

// Preview Logic
const showViewer = ref(false)
const currentPreviewUrl = ref('')

const openPreview = (url) => {
  currentPreviewUrl.value = url
  showViewer.value = true
}

const closePreview = () => {
  showViewer.value = false
}
</script>

<style scoped>
.photo-board {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.photo-filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 56px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-left {
  display: flex;
  gap: 24px;
}
.filter-link {
  font-size: 14px;
  color: #666;
  cursor: pointer;
  position: relative;
  height: 56px;
  line-height: 56px;
  transition: color 0.2s;
}
.filter-link:hover { color: #333; }
.filter-link.active {
  color: #0077ff; /* Based on the screenshot's blue active color */
  font-weight: 600;
}
.filter-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: #0077ff;
}

.filter-right {
  display: flex;
  gap: 20px;
}
.dropdown-link {
  font-size: 13px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
.dropdown-link:hover { color: #333; }

/* Justified Gallery */
.photo-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 4px; /* Tiny gap for that tight portfolio look */
  padding: 4px;
  background: #fff;
}

.photo-item {
  height: 280px; /* Base row height */
  position: relative;
  cursor: pointer;
  overflow: hidden;
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  vertical-align: bottom;
  transition: transform 0.4s ease;
}

.photo-item:hover img {
  transform: scale(1.03);
}

/* Ensure the last row doesn't stretch a single image to full width */
.photo-gallery::after {
  content: '';
  flex-grow: 999999999;
}

/* Overlay */
.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 50%, rgba(0,0,0,0.7) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  color: #fff;
  pointer-events: none;
}

.photo-item:hover .photo-overlay {
  opacity: 1;
}

.photo-title {
  font-size: 15px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0,0,0,0.6);
}

.overlay-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.author-name {
  font-size: 13px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0,0,0,0.6);
}

.photo-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  font-weight: 500;
}
.photo-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.6);
}
.fav-btn.active { color: #fadb14; }
.fav-btn:hover { transform: scale(1.1); }

/* Popover Styles */
.category-popover {
  padding: 8px 4px;
}
.popover-title {
  font-size: 15px;
  color: #333;
  margin: 0 0 16px 12px;
  cursor: pointer;
  font-weight: 600;
  transition: color 0.2s;
}
.popover-title:hover, .popover-title.active {
  color: #0077ff;
}
.category-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 14px;
  column-gap: 20px;
  padding-left: 12px;
}
.cat-item {
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: color 0.2s;
}
.cat-item:hover, .cat-item.active {
  color: #0077ff;
}

@media (max-width: 1200px) {
  .photo-item { height: 220px; }
}

@media (max-width: 768px) {
  .photo-item { height: 160px; }
  .photo-filter-bar { display: none; }
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 30px 0;
  width: 100%;
}
</style>
