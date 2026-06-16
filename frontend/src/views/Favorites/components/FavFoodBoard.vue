<template>
  <div class="fav-food-board">
    <div class="board-header">
      <h2>我的私人食谱</h2>
      <p class="subtitle">人间烟火，唯有美食不可辜负</p>
    </div>

    <div class="food-grid">
      <div 
        class="food-card" 
        v-for="item in items" 
        :key="item.id"
      >
        <div class="card-img-wrap">
          <img :src="item.img" :alt="item.title" class="food-img" />
          
          <div class="fav-btn active" @click.stop="toggleFavorite('food', item.id)">
            <el-icon><StarFilled /></el-icon>
          </div>
          
          <div class="card-overlay">
            <button class="recipe-btn">查看食谱</button>
          </div>
        </div>
        
        <div class="card-content">
          <h3 class="food-title">{{ item.title }}</h3>
          <p class="food-author">by {{ item.author }}</p>
          
          <div class="food-metrics">
            <span class="metric-badge time">
              <el-icon><Timer /></el-icon> {{ item.time }}
            </span>
            <span class="metric-badge cal">
              <el-icon><Food /></el-icon> {{ item.calories }}
            </span>
            <span class="metric-badge rating">
              <el-icon><Star /></el-icon> {{ item.rating }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <el-empty v-if="!items || items.length === 0" description="暂无收藏的美食" />
  </div>
</template>

<script setup>
import { Timer, Food, Star, StarFilled } from '@element-plus/icons-vue'
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
.fav-food-board {
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
  font-size: 30px;
  font-weight: 800;
  color: #2c3e50;
  margin: 0 0 10px;
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%);
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 14px;
  color: #888;
  letter-spacing: 2px;
}

.food-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 30px;
}

.food-card {
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.06);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid #fff5f5;
  cursor: pointer;
}

.food-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(255, 107, 107, 0.15);
}

.card-img-wrap {
  width: 100%;
  height: 200px;
  position: relative;
  overflow: hidden;
}

.food-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}

.food-card:hover .food-img {
  transform: scale(1.08);
}

.card-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
}

.food-card:hover .card-overlay {
  opacity: 1;
}

.recipe-btn {
  background: #ff6b6b;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: bold;
  transform: translateY(20px);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
}

.food-card:hover .recipe-btn {
  transform: translateY(0);
}

.recipe-btn:hover {
  background: #ff5252;
  box-shadow: 0 4px 15px rgba(255, 82, 82, 0.4);
}

.fav-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 36px;
  height: 36px;
  background: rgba(255,255,255,0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #ccc;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  z-index: 2;
}

.fav-btn.active {
  color: #ff6b6b;
}

.fav-btn:hover {
  transform: scale(1.15);
}

.card-content {
  padding: 24px;
}

.food-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin: 0 0 6px;
  transition: color 0.3s;
}

.food-card:hover .food-title {
  color: #ff6b6b;
}

.food-author {
  font-size: 13px;
  color: #999;
  margin: 0 0 16px;
}

.food-metrics {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.metric-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
}

.metric-badge.time {
  background: #fdf2f3;
  color: #ff6b6b;
}

.metric-badge.cal {
  background: #f4fdf6;
  color: #4cd137;
}

.metric-badge.rating {
  background: #fff9e6;
  color: #ffb142;
}
</style>
