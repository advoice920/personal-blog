<template>
  <div class="fashion-board">
    <div class="editorial-header">
      <h1 class="vogue-title">VOGUE</h1>
      <div class="subtitle">AUTUMN/WINTER 2026 COLLECTION</div>
    </div>

    <div class="fashion-grid" v-if="displayData.length > 0">
      <div 
        v-for="(item, index) in displayData" 
        :key="item.id" 
        class="fashion-card"
        :class="{'large-item': index === 0, 'offset-item': index % 2 !== 0}"
        @click="openFashion(item)"
      >
        <div class="fashion-img">
          <img :src="item.img" :alt="item.title" loading="lazy" />
          <div class="fav-btn" :class="{ active: isFavorited('fashion', item.id) }" @click.stop="toggleFavorite('fashion', item.id)">
            <el-icon><StarFilled /></el-icon>
          </div>
        </div>
        <div class="fashion-text">
          <span class="brand">{{ item.brand }}</span>
          <h2>{{ item.title }}</h2>
          <p>{{ item.text }}</p>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>暂无内容，等待时尚灵感的降临！</p>
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

    <!-- Fashion Magazine Dialog -->
    <el-dialog v-model="showFashion" width="1000px" class="fashion-dialog" append-to-body destroy-on-close>
      <div v-if="currentFashion" class="fashion-detail-layout">
        <div class="f-hero-section">
          <img :src="currentFashion.img" :alt="currentFashion.title" class="f-hero-img" />
          <div class="f-title-box">
            <div class="f-brand-name">{{ currentFashion.brand }}</div>
            <h2 class="f-mag-title">{{ currentFashion.title }}</h2>
          </div>
        </div>

        <div class="f-mag-body">
          <div class="f-meta-info">
            <p><strong>DESIGNER</strong> <br> {{ currentFashion.designer }}</p>
            <p><strong>COLLECTION</strong> <br> {{ currentFashion.collection }}</p>
            <div style="margin-left: auto; align-self: center;">
              <el-button 
                :type="isFavorited('fashion', currentFashion.id) ? 'danger' : 'default'"
                @click="toggleFavorite('fashion', currentFashion.id)"
                round
              >
                <el-icon style="margin-right: 4px"><StarFilled v-if="isFavorited('fashion', currentFashion.id)" /><Star v-else /></el-icon>
                {{ isFavorited('fashion', currentFashion.id) ? '已收藏' : '收藏穿搭' }}
              </el-button>
            </div>
          </div>
          
          <div class="f-editorial">
            <p class="f-dropcap">{{ currentFashion.detailedReview }}</p>
          </div>

          <div class="f-lookbook">
            <div v-for="(look, idx) in currentFashion.lookbook" :key="idx" class="look-img-wrapper">
              <img :src="look" alt="Lookbook" />
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed , onMounted} from 'vue'
import { StarFilled, Star } from '@element-plus/icons-vue'
import { getFashionData, addHistory } from '@/api/index.js'
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
      const res = await getFashionData({ page: currentPage.value, limit: pageSize.value })
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

const showFashion = ref(false)
const currentFashion = ref(null)

const openFashion = (item) => {
  currentFashion.value = item
  showFashion.value = true
  addHistory({ module_name: 'fashion', item_id: String(item.id), title: item.title, cover: item.img || item.cover || item.image });
}
</script>

<style scoped>
.fashion-board {
  background: #faf8f5; /* off-white paper feel */
  padding: 40px;
}

.editorial-header {
  text-align: center;
  margin-bottom: 60px;
  border-bottom: 2px solid #111;
  padding-bottom: 20px;
}
.vogue-title {
  font-family: 'Didot', 'Bodoni MT', serif;
  font-size: 80px;
  letter-spacing: 8px;
  color: #111;
  margin: 0;
  font-weight: 400;
}
.subtitle {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-size: 13px;
  letter-spacing: 4px;
  color: #666;
  text-transform: uppercase;
  margin-top: 10px;
}

.fashion-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 40px;
}

.fashion-card {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.4s ease;
}
.fashion-card:hover {
  transform: translateY(-8px);
}
.fashion-card:hover .f-img img {
  grid-column: 1 / -1;
  flex-direction: row;
  align-items: center;
  gap: 40px;
}

.large-item {
  grid-column: 1 / -1;
  flex-direction: row;
  align-items: center;
  gap: 40px;
}

.offset-item {
  margin-top: 80px; /* asymmetrical staggered look */
}

.fashion-img {
  overflow: hidden;
  margin-bottom: 20px;
}
.large-item .fashion-img {
  width: 60%;
  margin-bottom: 0;
}
.fashion-img img {
  width: 100%;
  aspect-ratio: 3/4;
  object-fit: cover;
  filter: sepia(10%) contrast(110%);
  transition: transform 1s ease;
}
.fashion-item:hover .fashion-img img {
  transform: scale(1.03);
}

.fav-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(255,255,255,0.8);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 2;
}
.fav-btn:hover { background: #fff; transform: scale(1.1); }
.fav-btn.active { color: #111; }

.empty-state { text-align: center; padding: 60px 0; color: #999; grid-column: 1 / -1; font-family: 'Didot', serif; font-size: 20px; }

.fashion-text {
  text-align: center;
}
.large-item .fashion-text {
  width: 40%;
  text-align: left;
  padding: 40px;
}

.brand {
  font-size: 12px;
  letter-spacing: 2px;
  color: #888;
  text-transform: uppercase;
  display: block;
  margin-bottom: 12px;
}
.fashion-text h2 {
  font-family: 'Didot', serif;
  font-size: 28px;
  color: #111;
  margin-bottom: 16px;
  line-height: 1.2;
}
.large-item .fashion-text h2 {
  font-size: 48px;
}
.fashion-text p {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

/* Fashion Dialog (VOGUE Style) */
:deep(.fashion-dialog) {
  border-radius: 0;
  overflow: hidden;
  padding: 0;
}
:deep(.fashion-dialog .el-dialog__header) {
  display: none;
}
:deep(.fashion-dialog .el-dialog__body) {
  padding: 0;
}

.fashion-detail-layout {
  max-height: 85vh;
  overflow-y: auto;
  background: #fff;
  color: #111;
}
.fashion-detail-layout::-webkit-scrollbar { width: 4px; }
.fashion-detail-layout::-webkit-scrollbar-thumb { background: #111; }

.f-hero-section {
  position: relative;
  width: 100%;
  height: 500px;
  overflow: hidden;
}
.f-hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(20%);
}
.f-title-box {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  padding: 40px 60px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  width: 80%;
  max-width: 600px;
}
.f-brand-name {
  font-size: 14px;
  letter-spacing: 4px;
  text-transform: uppercase;
  margin-bottom: 12px;
  color: #666;
}
.f-mag-title {
  font-family: 'Didot', 'Playfair Display', serif;
  font-size: 36px;
  font-weight: 400;
  margin: 0;
  line-height: 1.2;
}

.f-mag-body {
  padding: 80px 10%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.f-meta-info {
  display: flex;
  gap: 80px;
  margin-bottom: 60px;
  text-align: center;
}
.f-meta-info p {
  font-size: 13px;
  color: #555;
  line-height: 1.8;
  letter-spacing: 1px;
}
.f-meta-info strong {
  color: #111;
  font-size: 11px;
  letter-spacing: 2px;
}

.f-editorial {
  max-width: 700px;
  margin-bottom: 80px;
}
.f-dropcap::first-letter {
  float: left;
  font-family: 'Didot', 'Playfair Display', serif;
  font-size: 80px;
  line-height: 60px;
  padding-right: 12px;
  padding-top: 8px;
  color: #111;
}
.f-editorial p {
  font-family: 'Georgia', serif;
  font-size: 18px;
  line-height: 2;
  color: #333;
  text-align: justify;
}

.f-lookbook {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  width: 100%;
}
.look-img-wrapper img {
  width: 100%;
  height: 600px;
  object-fit: cover;
}

@media (max-width: 768px) {
  .f-hero-section { height: 350px; }
  .f-title-box { padding: 24px; width: 90%; }
  .f-mag-title { font-size: 24px; }
  .f-mag-body { padding: 40px 20px; }
  .f-meta-info { flex-direction: column; gap: 20px; }
  .f-lookbook { grid-template-columns: 1fr; }
  .look-img-wrapper img { height: 400px; }
}

@media (max-width: 900px) {
  .fashion-grid { grid-template-columns: 1fr; }
  .large-item { flex-direction: column; }
  .large-item .fashion-img, .large-item .fashion-text { width: 100%; }
  .offset-item { margin-top: 0; }
  .vogue-title { font-size: 48px; }
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 30px 0;
  width: 100%;
}
</style>
