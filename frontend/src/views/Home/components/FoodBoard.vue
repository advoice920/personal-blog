<template>
  <div class="food-board">
    <div class="board-header">
      <h2>发现美味 🍳</h2>
      <p>探索全球灵感菜谱与探店指南</p>
    </div>
    
    <div class="masonry-grid" v-if="displayData.length > 0">
      <div v-for="item in displayData" :key="item.id" class="food-card" @click="openRecipe(item)">
        <div class="img-wrapper" :style="{ height: item.height + 'px' }">
          <img :src="item.img" :alt="item.title" loading="lazy" />
          <div class="calorie-tag">{{ item.calories }}</div>
          <div class="fav-btn" :class="{ active: isFavorited('food', item.id) }" @click.stop="toggleFavorite('food', item.id)">
            <el-icon><StarFilled /></el-icon>
          </div>
        </div>
        <div class="food-info">
          <h3>{{ item.title }}</h3>
          <div class="food-meta">
            <span class="author">{{ item.author }}</span>
            <div class="stats">
              <span><el-icon><Timer /></el-icon> {{ item.time }}</span>
              <span class="rating"><el-icon><StarFilled /></el-icon> {{ item.rating }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>暂无内容，快去发现美味吧！</p>
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

    <!-- Recipe Dialog -->
    <el-dialog v-model="showRecipe" :show-close="true" width="800px" class="recipe-dialog" append-to-body destroy-on-close>
      <div v-if="currentRecipe" class="recipe-detail-layout">
        <div class="recipe-hero-img">
          <img :src="currentRecipe.img" :alt="currentRecipe.title" />
        </div>
        
        <div class="recipe-body">
          <h2 class="recipe-title">{{ currentRecipe.title }}</h2>
          <div class="recipe-author">by {{ currentRecipe.author }}</div>
          
          <div class="recipe-meta-tags">
            <span class="r-tag"><el-icon><Timer /></el-icon> {{ currentRecipe.time }}</span>
            <span class="r-tag"><el-icon><Food /></el-icon> {{ currentRecipe.calories }}</span>
            <span class="r-tag star"><el-icon><StarFilled /></el-icon> {{ currentRecipe.rating }}</span>
            <el-button 
              class="recipe-fav-btn" 
              :type="isFavorited('food', currentRecipe.id) ? 'danger' : 'default'"
              @click="toggleFavorite('food', currentRecipe.id)"
              round
            >
              <el-icon style="margin-right: 4px"><StarFilled v-if="isFavorited('food', currentRecipe.id)" /><Star v-else /></el-icon>
              {{ isFavorited('food', currentRecipe.id) ? '已收藏' : '收藏食谱' }}
            </el-button>
          </div>

          <div class="recipe-section">
            <h3>📝 所需用料</h3>
            <ul class="ingredients-list">
              <li v-for="ing in currentRecipe.ingredients" :key="ing.name">
                <span class="ing-name">{{ ing.name }}</span>
                <span class="ing-amount">{{ ing.amount }}</span>
              </li>
            </ul>
          </div>

          <div class="recipe-section">
            <h3>🍳 烹饪教程</h3>
            <div class="steps-list">
              <div v-for="(step, index) in currentRecipe.steps" :key="index" class="step-item">
                <div class="step-num">{{ index + 1 }}</div>
                <div class="step-text">{{ step }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed , onMounted} from 'vue'
import { Timer, StarFilled, Star, Food } from '@element-plus/icons-vue'
import { getFoodData, addHistory } from '@/api/index.js'
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
      const res = await getFoodData({ page: currentPage.value, limit: pageSize.value })
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

const showRecipe = ref(false)
const currentRecipe = ref(null)

const openRecipe = (recipe) => {
  currentRecipe.value = recipe
  showRecipe.value = true
  addHistory({ module_name: 'food', item_id: String(recipe.id), title: recipe.title, cover: recipe.img || recipe.cover || recipe.image });
}
</script>

<style scoped>
.food-board {
  padding: 24px 0;
}
.board-header {
  margin-bottom: 32px;
  text-align: center;
}
.board-header h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}
.board-header p {
  color: #666;
}

.masonry-grid {
  column-count: 4;
  column-gap: 20px;
}
@media (max-width: 1200px) { .masonry-grid { column-count: 3; } }
@media (max-width: 900px) { .masonry-grid { column-count: 2; } }
@media (max-width: 600px) { .masonry-grid { column-count: 1; } }

.food-card {
  break-inside: avoid;
  margin-bottom: 20px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}
.food-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.img-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
}
.img-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.food-card:hover .img-wrapper img {
  transform: scale(1.05);
}

.calorie-tag {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255,255,255,0.9);
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #ff6b6b;
}

.fav-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  background: rgba(255,255,255,0.8);
  width: 32px;
  height: 32px;
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

.empty-state { text-align: center; padding: 60px 0; color: #999; }

.food-info {
  padding: 16px;
}
.food-info h3 {
  font-size: 16px;
  color: #333;
  margin: 0 0 12px 0;
  line-height: 1.4;
}
.food-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #666;
}
.stats {
  display: flex;
  gap: 12px;
}
.stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}
.rating {
  color: #fadb14;
  font-weight: 600;
}

/* Recipe Dialog Styles */
:deep(.recipe-dialog) {
  border-radius: 20px;
  overflow: hidden;
  padding: 0;
}
:deep(.recipe-dialog .el-dialog__header) {
  display: none;
}
:deep(.recipe-dialog .el-dialog__body) {
  padding: 0;
}

.recipe-detail-layout {
  display: flex;
  flex-direction: column;
  max-height: 85vh;
  overflow-y: auto;
}
.recipe-detail-layout::-webkit-scrollbar {
  width: 6px;
}
.recipe-detail-layout::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

.recipe-hero-img {
  width: 100%;
  height: 350px;
}
.recipe-hero-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recipe-body {
  padding: 40px;
  background: #fff;
}
.recipe-title {
  font-size: 28px;
  color: #333;
  margin: 0 0 8px 0;
}
.recipe-author {
  color: #888;
  font-size: 14px;
  margin-bottom: 24px;
}

.recipe-meta-tags {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
}
.r-tag {
  background: #f5f5f5;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  color: #555;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}
.r-tag.star { color: #fadb14; background: #fffbe6; }
.recipe-fav-btn { margin-left: auto; font-weight: 600; }

.recipe-section {
  margin-bottom: 40px;
}
.recipe-section h3 {
  font-size: 18px;
  color: #222;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ingredients-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.ingredients-list li {
  display: flex;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px dashed #eee;
  font-size: 15px;
}
.ing-name { color: #333; font-weight: 500; }
.ing-amount { color: #666; }

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.step-item {
  display: flex;
  gap: 16px;
}
.step-num {
  width: 28px;
  height: 28px;
  background: #fc3c44;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}
.step-text {
  font-size: 15px;
  line-height: 1.6;
  color: #444;
  padding-top: 2px;
}

@media (max-width: 768px) {
  .recipe-hero-img { height: 250px; }
  .recipe-body { padding: 24px; }
  .ingredients-list { grid-template-columns: 1fr; }
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 30px 0;
  width: 100%;
}
</style>
