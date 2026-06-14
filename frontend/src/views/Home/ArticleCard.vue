<template>
  <article class="article-card">
    <router-link :to="'/post/' + article.id" class="card-link">
      <div class="card-body">
        <div class="author-row">
          <el-avatar :size="22" :icon="UserFilled" />
          <span class="author-name">{{ article.author.name }}</span>
          <span class="dot">·</span>
          <span class="time">{{ article.createdAt }}</span>
        </div>
        <h3 class="card-title">{{ article.title }}</h3>
        <p class="card-summary">{{ article.summary }}</p>
        <div class="card-footer">
          <div class="tags">
            <span v-for="tag in article.tags" :key="tag" class="tag">{{ tag }}</span>
          </div>
          <div class="stats">
            <span class="stat fav-btn" :class="{ 'is-active': isFavorited('article', article.id) }" @click.prevent="toggleFavorite('article', article.id)">
              <el-icon :size="14"><StarFilled /></el-icon> 
            </span>
            <span class="stat"><el-icon :size="14"><View /></el-icon> {{ formatNum(article.views) }}</span>
            <span class="stat"><el-icon :size="14"><Star /></el-icon> {{ formatNum(article.likes) }}</span>
            <span class="stat"><el-icon :size="14"><ChatDotRound /></el-icon> {{ article.comments }}</span>
          </div>
        </div>
      </div>
      <div v-if="article.thumbnail" class="card-thumb">
        <img :src="article.thumbnail" :alt="article.title" referrerpolicy="no-referrer" />
      </div>
    </router-link>
    <span class="category-badge" :class="'cat-' + article.category">
      {{ catMap[article.category] || '文章' }}
    </span>
  </article>
</template>

<script setup>
import { UserFilled, View, Star, ChatDotRound, StarFilled } from '@element-plus/icons-vue'
import { isFavorited, toggleFavorite } from '@/store/favorites.js'
defineProps({ article: { type: Object, required: true } })

const catMap = {
  food: '美食', travel: '旅行', photo: '摄影', reading: '读书',
  music: '音乐', movie: '电影', sports: '运动', pet: '宠物', fashion: '穿搭'
}

function formatNum(num) { return num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num }
</script>

<style scoped>
.article-card { position: relative; background: #fff; border-radius: 8px; transition: all 0.2s; border: 1px solid #f0f0f0; }
.article-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-1px); }

.category-badge {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 11px;
  color: #fff;
  background: #fc3c44;
  padding: 4px 10px;
  border-bottom-left-radius: 8px;
  border-top-right-radius: 8px;
  font-weight: 600;
  pointer-events: none;
}
.cat-food { background: #ff9800; }
.cat-travel { background: #00bcd4; }
.cat-photo { background: #9c27b0; }
.cat-reading { background: #795548; }
.cat-music { background: #3f51b5; }
.cat-movie { background: #e91e63; }
.cat-sports { background: #fc4c02; }
.cat-pet { background: #8bc34a; }
.cat-fashion { background: #111; }
.card-link { display: flex; gap: 20px; padding: 18px 20px; text-decoration: none; color: inherit; }
.card-body { flex: 1; min-width: 0; }
.author-row { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
.author-name { font-size: 13px; color: #555; }
.dot, .time { font-size: 12px; color: #bbb; }
.card-title { font-size: 17px; font-weight: 700; color: #252933; margin: 0 0 8px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-title:hover { color: #fc3c44; }
.card-summary { font-size: 13px; color: #555; line-height: 1.6; margin: 0 0 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-footer { display: flex; align-items: center; justify-content: space-between; }
.tags { display: flex; gap: 8px; }
.tag { font-size: 12px; font-weight: 500; color: #555; padding: 2px 8px; background: rgba(0, 0, 0, 0.05); border-radius: 4px; }
.stats { display: flex; gap: 14px; }
.stat { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: #555; }
.stat .el-icon { stroke-width: 2; } /* Make icons look bolder */
.fav-btn { cursor: pointer; transition: color 0.2s; }
.fav-btn:hover { color: #fc3c44; }
.fav-btn.is-active { color: #fc3c44; }
.card-thumb { width: 140px; height: 88px; flex-shrink: 0; border-radius: 6px; overflow: hidden; background: #f5f6f7; }
.card-thumb img { width: 100%; height: 100%; object-fit: cover; }
</style>
