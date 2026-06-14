<template>
  <div class="fav-movie-board">
    <div class="board-header">
      <h2>我的放映室</h2>
      <p class="subtitle">光影交错，定格美好</p>
    </div>

    <div class="movie-grid">
      <div 
        class="movie-card" 
        v-for="movie in items" 
        :key="movie.id"
      >
        <div class="poster-container">
          <img :src="movie.cover || movie.thumbnail" :alt="movie.title" class="poster-img" />
          
          <div class="poster-overlay">
            <div class="overlay-content">
              <h3 class="hover-title">{{ movie.title }}</h3>
              <div class="movie-tags">
                <span class="m-tag" v-if="movie.category">{{ movie.category }}</span>
                <span class="m-tag rating" v-if="movie.rating">
                  <el-icon><Star /></el-icon> {{ movie.rating }}
                </span>
              </div>
              <button class="play-btn">
                <el-icon><CaretRight /></el-icon> 立即播放
              </button>
            </div>
          </div>
          
          <div class="rating-badge" v-if="movie.rating">
            {{ movie.rating }}
          </div>
          
          <div class="fav-action active" @click.stop="toggleFavorite('movie', movie.id)">
            <el-icon><StarFilled /></el-icon>
          </div>
        </div>
        
        <div class="movie-info">
          <h3 class="movie-title">{{ movie.title }}</h3>
          <p class="movie-category">{{ movie.category || '电影' }}</p>
        </div>
      </div>
    </div>
    
    <el-empty v-if="!items || items.length === 0" description="暂无收藏的影视" />
  </div>
</template>

<script setup>
import { CaretRight, Star, StarFilled } from '@element-plus/icons-vue'
import { isFavorited, toggleFavorite } from '@/store/favorites.js'

defineProps({
  items: {
    type: Array,
    required: true,
    default: () => []
  }
})
</script>

<style scoped>
.fav-movie-board {
  padding: 20px 0;
  animation: fadeIn 0.6s ease;
  /* Dark mode touch just for the movie board */
  background: #0f1115;
  border-radius: 20px;
  padding: 40px;
  color: #fff;
  box-shadow: inset 0 0 50px rgba(0,0,0,0.5);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

.board-header {
  margin-bottom: 40px;
  text-align: center;
}

.board-header h2 {
  font-size: 32px;
  font-weight: 900;
  color: #fff;
  margin: 0 0 10px;
  text-shadow: 0 2px 10px rgba(255, 255, 255, 0.2);
  letter-spacing: 2px;
}

.subtitle {
  font-size: 15px;
  color: #888;
  letter-spacing: 4px;
}

.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 30px;
}

.movie-card {
  cursor: pointer;
  position: relative;
}

.poster-container {
  width: 100%;
  aspect-ratio: 2 / 3;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 10px 20px rgba(0,0,0,0.3);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease, filter 0.4s ease;
}

.movie-card:hover .poster-container {
  transform: translateY(-10px) scale(1.03);
  box-shadow: 0 15px 30px rgba(210, 105, 30, 0.3);
}

.movie-card:hover .poster-img {
  transform: scale(1.1);
  filter: blur(2px) brightness(0.7);
}

.poster-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 17, 21, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.4s ease;
  z-index: 2;
}

.movie-card:hover .poster-overlay {
  opacity: 1;
}

.overlay-content {
  text-align: center;
  padding: 20px;
  transform: translateY(20px);
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.movie-card:hover .overlay-content {
  transform: translateY(0);
}

.hover-title {
  font-size: 18px;
  color: #fff;
  margin: 0 0 15px;
  font-weight: bold;
}

.movie-tags {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.m-tag {
  font-size: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
}

.m-tag.rating {
  color: #ff9d00;
  border-color: rgba(255, 157, 0, 0.3);
  background: rgba(255, 157, 0, 0.1);
}

.play-btn {
  background: #d2691e;
  border: none;
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
}

.play-btn:hover {
  background: #e67e22;
  transform: scale(1.05);
}

.rating-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0,0,0,0.6);
  color: #ff9d00;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 800;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.1);
  z-index: 3;
}

.fav-action {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  background: rgba(0,0,0,0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
  z-index: 3;
}

.fav-action.active {
  color: #fc3c44;
}

.fav-action:hover {
  transform: scale(1.1);
  background: rgba(252, 60, 68, 0.2);
}

.movie-info {
  margin-top: 15px;
  text-align: center;
}

.movie-title {
  font-size: 15px;
  color: #ddd;
  margin: 0 0 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.movie-category {
  font-size: 12px;
  color: #777;
  margin: 0;
}

@media (max-width: 1200px) {
  .movie-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
