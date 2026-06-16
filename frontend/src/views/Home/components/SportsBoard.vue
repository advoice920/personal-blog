<template>
  <div class="sports-board">
    <!-- Vibe Tags Header -->
    <div class="vibe-tags-container">
      <h2 class="section-title">Explore by Vibe ✨</h2>
      <div class="tags-scroll">
        <button 
          v-for="tag in availableTags" 
          :key="tag"
          class="vibe-tag"
          :class="{ active: activeTag === tag }"
          @click="activeTag = activeTag === tag ? null : tag"
        >
          {{ tag }}
        </button>
      </div>
    </div>

    <!-- Masonry Feed -->
    <div class="masonry-feed">
      <div 
        v-for="post in filteredPosts" 
        :key="post.id" 
        class="blog-card" 
        @click="openPost(post)"
      >
        <div class="card-cover">
          <img :src="post.cover" loading="lazy" :alt="post.title" />
          <div class="card-overlay">
            <div class="tags-list">
              <span v-for="t in post.tags" :key="t" class="overlay-tag">{{ t }}</span>
            </div>
          </div>
        </div>
        <div class="card-body">
          <h3 class="card-title">{{ post.title }}</h3>
          <div class="card-footer">
            <div class="author-info">
              <el-avatar :size="24" :src="post.author.avatar" />
              <span class="author-name">{{ post.author.name }}</span>
            </div>
            <div class="likes">
              <el-icon><Star /></el-icon>
              <span>{{ post.likes }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredPosts.length === 0" class="empty-state">
      <p>没有找到相关的生活方式博客~</p>
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

    <!-- Blog Post Dialog -->
    <el-dialog 
      v-model="showPost" 
      width="680px" 
      class="blog-dialog" 
      append-to-body 
      destroy-on-close
    >
      <div v-if="currentPost" class="blog-detail-layout">
        <div class="b-hero">
          <img :src="currentPost.cover" :alt="currentPost.title" class="b-hero-img" />
        </div>

        <div class="b-content">
          <h2 class="b-title">{{ currentPost.title }}</h2>
          <div class="b-author-bar">
            <div class="b-author-info">
              <el-avatar :size="40" :src="currentPost.author.avatar" />
              <div>
                <div class="b-author-name">{{ currentPost.author.name }}</div>
                <div class="b-date">刚刚发布</div>
              </div>
            </div>
            <el-button 
              :type="isFavorited('sports', currentPost.id) ? 'warning' : 'default'"
              @click="toggleFavorite('sports', currentPost.id)"
              round 
              size="small"
            >
              <el-icon style="margin-right: 4px">
                <StarFilled v-if="isFavorited('sports', currentPost.id)" />
                <Star v-else />
              </el-icon>
              {{ isFavorited('sports', currentPost.id) ? '已收藏' : '收藏' }}
            </el-button>
          </div>

          <div class="b-text">
            {{ currentPost.content }}
          </div>

          <div v-if="currentPost.routine && currentPost.routine.length" class="routine-section">
            <div class="routine-header">
              <h3>📝 本期训练清单 (Routine)</h3>
              <span class="routine-count">{{ currentPost.routine.length }} 个动作</span>
            </div>
            <ul class="routine-list">
              <li v-for="(item, idx) in currentPost.routine" :key="idx" class="routine-item">
                <span class="r-index">{{ idx + 1 }}</span>
                <span class="r-name">{{ item.name }}</span>
                <span class="r-dur">{{ item.duration }}</span>
              </li>
            </ul>
            
            <div class="copy-action">
              <el-button 
                type="primary" 
                class="btn-copy-routine" 
                @click="copyRoutine"
                :loading="copying"
              >
                <el-icon v-if="!copying" style="margin-right: 6px;"><DocumentCopy /></el-icon>
                {{ copied ? '已存入我的计划！' : '一键抄作业 (获取同款日程)' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Star, StarFilled, DocumentCopy } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getSportsData, addHistory } from '@/api/index.js'
import { toggleFavorite, isFavorited } from '@/store/favorites.js'

const props = defineProps({
  items: {
    type: Array,
    default: () => null
  }
})

const localData = ref([])
const loading = ref(false)


const currentPage = ref(1)
const pageSize = ref(12)
const totalItems = ref(0)

const loadData = async () => {
  if (!props.items) {
    loading.value = true
    try {
      const res = await getSportsData({ page: currentPage.value, limit: pageSize.value })
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

const displayData = computed(() => props.items || localData.value)

// --- Tags & Filtering ---
const availableTags = ['#公园20分钟', '#情绪马杀鸡', '#周末去野', '#居家燃脂', '#早晨唤醒'];
const activeTag = ref(null);

const filteredPosts = computed(() => {
  if (!activeTag.value) return displayData.value;
  return displayData.value.filter(post => post.tags && post.tags.includes(activeTag.value));
});

// --- Dialog & Copy Routine ---
const showPost = ref(false);
const currentPost = ref(null);
const copying = ref(false);
const copied = ref(false);

const openPost = (post) => {
  currentPost.value = post;
  copied.value = false;
  showPost.value = true;
  addHistory({ module_name: 'sports', item_id: String(post.id), title: post.title, cover: post.cover || post.image });
;
};

const copyRoutine = () => {
  if (copied.value) return;
  copying.value = true;
  
  // Simulate network/processing delay for animation effect
  setTimeout(() => {
    copying.value = false;
    copied.value = true;
    ElMessage({
      message: '🎉 抄作业成功！已加入你的日程表。',
      type: 'success',
      customClass: 'blog-toast'
    });
  }, 800);
};
</script>

<style scoped>
.sports-board {
  max-width: 1000px;
  margin: 0 auto;
}

/* --- Vibe Tags Header --- */
.vibe-tags-container {
  margin-bottom: 32px;
}
.section-title {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 16px;
  color: #1a1a1a;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', sans-serif;
}
.tags-scroll {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.vibe-tag {
  background: #f4f5f7;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  font-weight: 500;
}
.vibe-tag:hover {
  background: #ebecee;
  transform: translateY(-2px);
}
.vibe-tag.active {
  background: #fc4c02;
  color: #fff;
  box-shadow: 0 4px 12px rgba(252, 76, 2, 0.3);
}

/* --- Masonry Feed --- */
.masonry-feed {
  column-count: 2;
  column-gap: 20px;
}
@media (max-width: 768px) {
  .masonry-feed {
    column-count: 1;
  }
}

.blog-card {
  break-inside: avoid;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 20px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid #f0f0f0;
}
.blog-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
}

.card-cover {
  position: relative;
  width: 100%;
}
.card-cover img {
  width: 100%;
  display: block;
  object-fit: cover;
}
.card-overlay {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
}
.tags-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.overlay-tag {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(4px);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  color: #fc4c02;
  font-weight: 600;
}

.card-body {
  padding: 16px;
}
.card-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  line-height: 1.4;
  color: #222;
  font-weight: 600;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
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
  font-size: 12px;
  color: #666;
}
.likes {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #999;
  font-size: 16px;
}

/* --- Dialog Styles --- */
:deep(.blog-dialog) {
  border-radius: 20px;
  overflow: hidden;
  padding: 0;
  background: #fff;
}
:deep(.blog-dialog .el-dialog__header) {
  display: none;
}
:deep(.blog-dialog .el-dialog__body) {
  padding: 0;
}

.blog-detail-layout {
  max-height: 85vh;
  overflow-y: auto;
  background: #fff;
}
.blog-detail-layout::-webkit-scrollbar { width: 6px; }
.blog-detail-layout::-webkit-scrollbar-thumb { background: #ddd; border-radius: 3px; }

.b-hero {
  width: 100%;
}
.b-hero-img {
  width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: cover;
  display: block;
}

.b-content {
  padding: 32px;
}
.b-title {
  font-size: 26px;
  color: #1a1a1a;
  margin: 0 0 20px 0;
  line-height: 1.4;
}

.b-author-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}
.b-author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.b-author-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}
.b-date {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.b-text {
  font-size: 16px;
  line-height: 1.8;
  color: #444;
  margin-bottom: 32px;
}

/* Routine Section */
.routine-section {
  background: #fafafa;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #eee;
}
.routine-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.routine-header h3 {
  margin: 0;
  font-size: 18px;
  color: #222;
}
.routine-count {
  font-size: 13px;
  color: #fc4c02;
  background: rgba(252, 76, 2, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
}

.routine-list {
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
}
.routine-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px dashed #e0e0e0;
}
.routine-item:last-child {
  border-bottom: none;
}
.r-index {
  width: 24px;
  height: 24px;
  background: #333;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  margin-right: 12px;
}
.r-name {
  flex: 1;
  font-size: 15px;
  color: #333;
  font-weight: 500;
}
.r-dur {
  font-size: 14px;
  color: #888;
}

.copy-action {
  text-align: center;
}
.btn-copy-routine {
  width: 100%;
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 600;
  background: #fc4c02;
  border-color: #fc4c02;
  transition: all 0.3s;
}
.btn-copy-routine:hover {
  background: #e04000;
  border-color: #e04000;
  box-shadow: 0 6px 16px rgba(252, 76, 2, 0.2);
}

:deep(.blog-toast) {
  border-radius: 20px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 30px 0;
  width: 100%;
}
</style>
