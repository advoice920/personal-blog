<template>
  <div class="travel-board">
    <div class="hero-section">
      <h1>The World is Yours to Explore</h1>
      <p>Discover breathtaking destinations and inspiring journeys.</p>
    </div>

    <div class="travel-feed" v-if="displayData.length > 0">
      <div v-for="item in displayData" :key="item.id" class="travel-card" @click="openTravel(item)">
        <div class="travel-img">
          <img :src="item.img" :alt="item.title" loading="lazy" />
          <div class="location-badge">
            <el-icon><Location /></el-icon> {{ item.location }}
          </div>
          <div class="fav-btn" :class="{ active: isFavorited('travel', item.id) }" @click.stop="toggleFavorite('travel', item.id)">
            <el-icon><StarFilled /></el-icon>
          </div>
        </div>
        <div class="travel-content">
          <div class="duration">{{ item.duration }}</div>
          <h2>{{ item.title }}</h2>
          <p>{{ item.text }}</p>
          <button class="read-more">Read Story</button>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>暂无内容，快去探索世界吧！</p>
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

    <!-- Travel Journal Dialog -->
    <el-dialog v-model="showTravel" width="900px" class="travel-dialog" append-to-body destroy-on-close>
      <div v-if="currentTravel" class="travel-detail-layout">
        <div class="t-hero" :style="{ backgroundImage: `url(${currentTravel.img})` }">
          <div class="t-hero-overlay">
            <div class="t-badge"><el-icon><Location /></el-icon> {{ currentTravel.location }}</div>
            <h1>{{ currentTravel.title }}</h1>
            <div class="t-duration">{{ currentTravel.duration }} Epic Journey</div>
            <el-button 
              :type="isFavorited('travel', currentTravel.id) ? 'danger' : 'default'"
              @click="toggleFavorite('travel', currentTravel.id)"
              round
              style="margin-top: 20px; width: fit-content;"
            >
              <el-icon style="margin-right: 4px"><StarFilled v-if="isFavorited('travel', currentTravel.id)" /><Star v-else /></el-icon>
              {{ isFavorited('travel', currentTravel.id) ? '已收藏' : '收藏这趟旅程' }}
            </el-button>
          </div>
        </div>

        <div class="t-body">
          <p class="t-intro">{{ currentTravel.text }}</p>

          <div class="t-section">
            <h3>🗓 行程安排 (Itinerary)</h3>
            <el-timeline>
              <el-timeline-item
                v-for="(day, index) in currentTravel.itinerary"
                :key="index"
                :timestamp="day.day + ' · ' + day.location"
                placement="top"
                color="#222"
              >
                <el-card shadow="hover" class="timeline-card">
                  <p>{{ day.desc }}</p>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>

          <div class="t-section tips-section">
            <h3>💡 旅行贴士 (Tips)</h3>
            <ul>
              <li v-for="(tip, idx) in currentTravel.tips" :key="idx">{{ tip }}</li>
            </ul>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed , onMounted} from 'vue'
import { Location, StarFilled, Star } from '@element-plus/icons-vue'
import { getTravelData, addHistory } from '@/api/index.js'
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
      const res = await getTravelData({ page: currentPage.value, limit: pageSize.value })
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

const showTravel = ref(false)
const currentTravel = ref(null)

const openTravel = (travel) => {
  currentTravel.value = travel
  showTravel.value = true
  addHistory({ module_name: 'travel', item_id: String(travel.id), title: travel.title, cover: travel.img || travel.cover || travel.image });
}
</script>

<style scoped>
.travel-board {
  width: 100%;
}
.hero-section {
  padding: 60px 0 40px;
  text-align: center;
  background: url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80') center/cover no-repeat;
  color: #fff;
  border-radius: 16px;
  margin-bottom: 40px;
  position: relative;
  overflow: hidden;
}
.hero-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
}
.hero-section h1, .hero-section p {
  position: relative;
  z-index: 1;
}
.hero-section h1 {
  font-size: 42px;
  font-family: 'Georgia', serif;
  margin-bottom: 12px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.travel-feed {
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.travel-card {
  display: flex;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  height: 300px;
}
.travel-img {
  width: 50%;
  position: relative;
}
.travel-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}
.travel-card:hover {
  cursor: pointer;
}
.travel-card:hover .travel-img img {
  transform: scale(1.05);
}
.location-badge {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(255,255,255,0.9);
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 13px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 4px;
}

.fav-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255,255,255,0.8);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 2;
}
.fav-btn:hover { background: #fff; transform: scale(1.1); }
.fav-btn.active { color: #fc3c44; }

.empty-state { text-align: center; padding: 60px 0; color: #999; }

.travel-content {
  width: 50%;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.duration {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #0077ff;
  font-weight: 700;
  margin-bottom: 12px;
}
.travel-content h2 {
  font-size: 28px;
  color: #222;
  margin-bottom: 16px;
  line-height: 1.3;
}
.travel-content p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 32px;
  font-size: 15px;
}
.read-more {
  align-self: flex-start;
  padding: 10px 24px;
  border: 2px solid #222;
  background: transparent;
  color: #222;
  font-weight: 600;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s;
}
.travel-card:hover .read-more {
  background: #222;
  color: #fff;
}

/* Travel Dialog */
:deep(.travel-dialog) {
  border-radius: 16px;
  overflow: hidden;
  padding: 0;
}
:deep(.travel-dialog .el-dialog__header) {
  display: none;
}
:deep(.travel-dialog .el-dialog__body) {
  padding: 0;
}

.travel-detail-layout {
  max-height: 85vh;
  overflow-y: auto;
}
.travel-detail-layout::-webkit-scrollbar { width: 6px; }
.travel-detail-layout::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }

.t-hero {
  height: 400px;
  background-size: cover;
  background-position: center;
  position: relative;
  color: #fff;
}
.t-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 40px;
}
.t-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(4px);
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  width: fit-content;
  margin-bottom: 16px;
}
.t-hero h1 {
  font-size: 36px;
  font-family: 'Georgia', serif;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}
.t-duration {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 2px;
  opacity: 0.9;
}

.t-body {
  padding: 40px;
  background: #fafafa;
}
.t-intro {
  font-size: 18px;
  color: #333;
  line-height: 1.8;
  font-family: 'Georgia', serif;
  margin-bottom: 40px;
  border-left: 4px solid #222;
  padding-left: 20px;
}
.t-section {
  margin-bottom: 40px;
}
.t-section h3 {
  font-size: 20px;
  color: #222;
  margin-bottom: 24px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ddd;
}

.timeline-card {
  border-radius: 8px;
  border: none;
}
.timeline-card p {
  margin: 0;
  color: #555;
  line-height: 1.6;
}
:deep(.el-timeline-item__timestamp) {
  font-size: 14px;
  font-weight: 600;
  color: #222;
}

.tips-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.tips-section li {
  background: #eef2f5;
  padding: 16px 20px;
  border-radius: 8px;
  color: #444;
  font-size: 15px;
  display: flex;
  align-items: center;
}
.tips-section li::before {
  content: '💡';
  margin-right: 12px;
}

@media (max-width: 900px) {
  .travel-card {
    flex-direction: column;
    height: auto;
  }
  .travel-img, .travel-content {
    width: 100%;
  }
  .travel-img { height: 250px; }
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 30px 0;
  width: 100%;
}
</style>
