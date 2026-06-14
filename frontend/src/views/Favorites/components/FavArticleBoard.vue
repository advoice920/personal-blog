<template>
  <div class="fav-article-board">
    <div class="board-header">
      <h2>我的文章收藏</h2>
      <p class="subtitle">珍藏的文字，随时的灵感</p>
    </div>
    
    <div class="article-grid">
      <article 
        class="glass-card" 
        v-for="article in items" 
        :key="article.id"
      >
        <router-link :to="'/post/' + article.id" class="card-link">
          <div v-if="article.thumbnail" class="card-cover">
            <img :src="article.thumbnail" :alt="article.title" />
            <div class="cover-overlay"></div>
            <span class="category-badge">{{ catMap[article.category] || '文章' }}</span>
          </div>
          
          <div class="card-content">
            <h3 class="card-title">{{ article.title }}</h3>
            <p class="card-summary">{{ article.summary }}</p>
            
            <div class="card-meta">
              <div class="author-info">
                <el-avatar :size="24" :icon="UserFilled" />
                <span class="author-name">{{ article.author?.name || '匿名' }}</span>
              </div>
              <span class="date">{{ article.createdAt }}</span>
            </div>
          </div>
          
          <div class="card-footer">
            <div class="tags">
              <span v-for="tag in article.tags?.slice(0,2)" :key="tag" class="tag">#{{ tag }}</span>
            </div>
            <div class="stats">
              <span class="stat active-fav" @click.prevent="toggleFavorite('article', article.id)">
                <el-icon><StarFilled /></el-icon>
              </span>
              <span class="stat"><el-icon><View /></el-icon> {{ formatNum(article.views) }}</span>
            </div>
          </div>
        </router-link>
      </article>
    </div>
    
    <el-empty v-if="!items || items.length === 0" description="暂无收藏的文章" />
  </div>
</template>

<script setup>
import { UserFilled, View, StarFilled } from '@element-plus/icons-vue'
import { isFavorited, toggleFavorite } from '@/store/favorites.js'

defineProps({
  items: {
    type: Array,
    required: true,
    default: () => []
  }
})

const catMap = {
  food: '美食', travel: '旅行', photo: '摄影', reading: '读书',
  music: '音乐', movie: '电影', sports: '运动', pet: '宠物', fashion: '穿搭'
}

function formatNum(num) {
  if (!num) return 0
  return num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num
}
</script>

<style scoped>
.fav-article-board {
  padding: 20px 0;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.board-header {
  margin-bottom: 30px;
  text-align: center;
}

.board-header h2 {
  font-size: 28px;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0 0 8px;
  background: linear-gradient(135deg, #fc3c44, #ff7a59);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 14px;
  color: #888;
  letter-spacing: 2px;
}

.article-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 30px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
}

.glass-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(252, 60, 68, 0.1);
  border-color: rgba(252, 60, 68, 0.2);
}

.card-link {
  display: flex;
  flex-direction: column;
  height: 100%;
  text-decoration: none;
  color: inherit;
}

.card-cover {
  width: 100%;
  height: 180px;
  position: relative;
  overflow: hidden;
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}

.glass-card:hover .card-cover img {
  transform: scale(1.08);
}

.cover-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6));
}

.category-badge {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(255, 255, 255, 0.9);
  color: #fc3c44;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  backdrop-filter: blur(5px);
}

.card-content {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.3s;
}

.glass-card:hover .card-title {
  color: #fc3c44;
}

.card-summary {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 20px;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 15px;
  border-top: 1px dashed #eee;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-name {
  font-size: 13px;
  font-weight: 600;
  color: #444;
}

.date {
  font-size: 12px;
  color: #aaa;
}

.card-footer {
  padding: 15px 24px;
  background: rgba(250, 250, 250, 0.5);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tags {
  display: flex;
  gap: 8px;
}

.tag {
  font-size: 12px;
  color: #fc3c44;
  background: rgba(252, 60, 68, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
}

.stats {
  display: flex;
  gap: 15px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #999;
}

.active-fav {
  color: #fc3c44;
  cursor: pointer;
  transition: transform 0.2s;
}

.active-fav:hover {
  transform: scale(1.2);
}
</style>
