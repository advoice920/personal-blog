<template>
  <div class="fav-music-board">
    <div class="board-header">
      <h2>我的音乐库</h2>
      <p class="subtitle">旋律不息，热爱不止</p>
    </div>

    <div class="music-grid">
      <div 
        class="music-card" 
        v-for="item in items" 
        :key="item.id"
        @click="goToDetail(item.id)"
      >
        <div class="card-inner">
          <div class="album-cover">
            <div class="vinyl-record"></div>
            <img :src="item.cover" :alt="item.title" class="cover-img" />
            <div class="play-overlay">
              <el-icon class="play-btn"><VideoPlay /></el-icon>
            </div>
          </div>
          
          <div class="music-info">
            <h3 class="music-title" :title="item.title">{{ item.title }}</h3>
            <p class="music-desc" v-if="item.desc">{{ item.desc }}</p>
            
            <div class="music-meta">
              <span class="play-count">
                <el-icon><Headset /></el-icon> {{ item.playCount }}
              </span>
              <span class="fav-icon active" @click.stop="toggleFavorite('music', item.id)">
                <el-icon><StarFilled /></el-icon>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <el-empty v-if="!items || items.length === 0" description="暂无收藏的音乐" />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { VideoPlay, Headset, StarFilled } from '@element-plus/icons-vue'
import { isFavorited, toggleFavorite } from '@/store/favorites.js'

defineProps({
  items: {
    type: Array,
    required: true,
    default: () => []
  }
})

const router = useRouter()

const goToDetail = (id) => {
  router.push(`/playlist/${id}`)
}
</script>

<style scoped>
.fav-music-board {
  padding: 20px 0;
  animation: fadeIn 0.6s ease;
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
  color: #1a1a1a;
  margin: 0 0 10px;
  background: linear-gradient(135deg, #1db954, #19e68c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 1px;
}

.subtitle {
  font-size: 15px;
  color: #888;
  letter-spacing: 3px;
  text-transform: uppercase;
}

.music-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 35px 25px;
}

.music-card {
  cursor: pointer;
  perspective: 1000px;
}

.card-inner {
  background: #ffffff;
  border-radius: 16px;
  padding: 15px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  border: 1px solid rgba(0,0,0,0.02);
}

.music-card:hover .card-inner {
  transform: translateY(-10px);
  box-shadow: 0 15px 35px rgba(29, 185, 84, 0.15);
  border-color: rgba(29, 185, 84, 0.2);
}

.album-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  margin-bottom: 15px;
  z-index: 2;
}

/* Vinyl Record Effect */
.vinyl-record {
  position: absolute;
  top: 5%;
  right: 5%;
  width: 90%;
  height: 90%;
  background: repeating-radial-gradient(
    #111 0, 
    #111 2px, 
    #222 3px, 
    #222 4px
  );
  border-radius: 50%;
  z-index: -1;
  transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 2px 2px 10px rgba(0,0,0,0.3);
}

.vinyl-record::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30%;
  height: 30%;
  background: #ff5e3a;
  border-radius: 50%;
  border: 2px solid #111;
}

.music-card:hover .vinyl-record {
  transform: translateX(30%) rotate(180deg);
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
  position: relative;
  z-index: 2;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.play-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 3;
}

.music-card:hover .play-overlay {
  opacity: 1;
}

.play-btn {
  font-size: 50px;
  color: #fff;
  transform: translateY(10px);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
}

.music-card:hover .play-btn {
  transform: translateY(0) scale(1.1);
  color: #1db954;
}

.music-info {
  position: relative;
  z-index: 4;
  background: #fff;
}

.music-title {
  font-size: 16px;
  font-weight: 700;
  color: #222;
  margin: 0 0 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s;
}

.music-card:hover .music-title {
  color: #1db954;
}

.music-desc {
  font-size: 12px;
  color: #1db954;
  background: rgba(29, 185, 84, 0.1);
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  margin-bottom: 12px;
  font-weight: 600;
}

.music-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
}

.play-count {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #888;
  font-weight: 500;
}

.fav-icon {
  font-size: 18px;
  cursor: pointer;
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fav-icon.active {
  color: #fc3c44;
}

.fav-icon:hover {
  transform: scale(1.2);
}
</style>
