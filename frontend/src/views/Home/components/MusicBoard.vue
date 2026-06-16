<template>
  <div class="music-board">
    <!-- Dynamic Category Pills (built from actual data) -->
    <div class="category-pills-container" v-if="!items">
      <div class="pills-scroll-area">
        <div class="pills-row">
          <div
            class="pill"
            :class="{ active: currentCategory === '全部' }"
            @click="selectCategory('全部')"
          >
            ✨ 全部 ({{ localData.length }})
          </div>
        </div>
        <div class="pills-row" v-for="group in dynamicCategoryGroups" :key="group.name">
          <span class="group-label">{{ group.name }}</span>
          <div class="pills-group">
            <div
              v-for="tag in group.tags"
              :key="tag.name"
              class="pill"
              :class="{ active: currentCategory === tag.name }"
              @click="selectCategory(tag.name)"
            >
              {{ tag.name }} <small>{{ tag.count }}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Immersive Playlist Grid -->
    <div class="playlist-grid">
      <div 
        class="music-card" 
        v-for="item in filteredPlaylists" 
        :key="item.id"
        @click="goToDetail(item)"
      >
        <div class="cover-wrapper">
          <div class="vinyl-disc"></div>
          <div class="cover-inner">
            <img :src="item.cover" :alt="item.title" class="cover" loading="lazy" />
            <div class="play-overlay"><el-icon><VideoPlay /></el-icon></div>
            <div class="bottom-bar">
              <span class="play-count"><el-icon><Headset /></el-icon> {{ formatNum(item.playCount) }}</span>
              <el-icon 
                class="fav-icon" 
                :class="{ 'is-active': isFavorited('music', item.id) }" 
                @click.stop="toggleFavorite('music', item.id)"
              ><StarFilled /></el-icon>
            </div>
          </div>
        </div>
        
        <div class="card-info">
          <h3 class="title">{{ item.title }}</h3>
          <p class="desc" v-if="parseFirstDesc(item.desc)">{{ parseFirstDesc(item.desc) }}</p>
          
          <div class="creator-row">
            <el-avatar :size="20" :src="item.creatorAvatar" />
            <span class="creator-name">{{ item.creatorName || '音乐达人' }}</span>
          </div>
          
          <div class="tags-row" v-if="parseTags(item.tags).length > 0">
            <span class="tag-pill" v-for="t in parseTags(item.tags).slice(0,3)" :key="t">{{ t }}</span>
          </div>
        </div>
      </div>
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
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Headset, VideoPlay, StarFilled } from '@element-plus/icons-vue'
import { getMusicData } from '@/api/index.js'
import { isFavorited, toggleFavorite } from '@/store/favorites.js'

const props = defineProps({
  items: {
    type: Array,
    default: null
  }
})

const router = useRouter()
const currentCategory = ref('全部')
const localData = ref([])
const loading = ref(false)

// Language/Style/Scene/Mood tag classification
const TAG_GROUPS = {
  '语种': ['华语', '欧美', '日语', '韩语', '粤语', '法语', '德语', '泰语', '西语', '纯音乐', 'K-Pop', '韩流', '华语经典'],
  '风格': ['流行', '摇滚', '民谣', '电子', '说唱', '古典', '爵士', 'R&B/Soul', '后摇', '金属', '朋克', '雷鬼', '布鲁斯', '乡村', '轻音乐', 'R&B', '灵魂乐', '钢琴', '迷幻', '氛围音乐', '冰岛', '经典', '90年代', '舞蹈'],
  '场景': ['清晨', '夜晚', '学习', '工作', '运动', '驾车', '散步', '旅行', '派对', '咖啡', '咖啡馆', '公路', '驾驶', '跑步', '写作', '运动歌单', '雨天', '城市', '毕业季', '校园', 'KTV必点'],
  '情感': ['怀旧', '清新', '治愈', '放松', '孤独', '快乐', '伤感', '浪漫', '安静', '激情', '慵懒', '疗愈', '能量', '青春', '节奏']
}

// Build categories dynamically from actual playlist tags
const dynamicCategoryGroups = computed(() => {
  const tagCount = {}
  localData.value.forEach(p => {
    const tags = parseTags(p.tags)
    tags.forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1 })
  })

  const usedTags = new Set()
  const groups = []

  for (const [groupName, knownTags] of Object.entries(TAG_GROUPS)) {
    const matched = []
    knownTags.forEach(t => {
      if (tagCount[t]) {
        matched.push({ name: t, count: tagCount[t] })
        usedTags.add(t)
      }
    })
    if (matched.length > 0) {
      groups.push({ name: groupName, tags: matched })
    }
  }

  // Collect leftover tags into "其他"
  const other = []
  for (const [tag, count] of Object.entries(tagCount)) {
    if (!usedTags.has(tag)) {
      other.push({ name: tag, count })
      usedTags.add(tag)
    }
  }
  if (other.length > 0) {
    groups.push({ name: '其他', tags: other })
  }

  return groups
})

const currentPage = ref(1)
const pageSize = ref(12)
const totalItems = ref(0)

const loadData = async () => {
  if (!props.items) {
    loading.value = true
    try {
      const res = await getMusicData({ page: currentPage.value, limit: pageSize.value })
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

// Parsers
const parseTags = (tagsRaw) => {
  if (!tagsRaw) return []
  if (Array.isArray(tagsRaw)) return tagsRaw
  try { return JSON.parse(tagsRaw) } catch(e) { return [] }
}

const parseFirstDesc = (descRaw) => {
  if (!descRaw) return ''
  if (Array.isArray(descRaw)) return descRaw[0] || ''
  try { 
    const arr = JSON.parse(descRaw) 
    return arr[0] || ''
  } catch(e) { 
    return descRaw 
  }
}

const formatNum = (num) => {
  if (!num) return '0'
  return num >= 10000 ? (num / 10000).toFixed(1) + 'w' : num
}

const filteredPlaylists = computed(() => {
  if (props.items) return props.items
  if (currentCategory.value === '全部') {
    return localData.value
  }
  return localData.value.filter(p => {
    const tags = parseTags(p.tags)
    return tags.includes(currentCategory.value)
  })
})

const selectCategory = (category) => {
  currentCategory.value = category
}

const goToDetail = (item) => {
  localStorage.setItem('currentPlaylist', JSON.stringify(item))
  router.push(`/playlist/${item.id}`)
}
</script>

<style scoped>
.music-board {
  padding: 10px 0 40px;
}

/* Category Pills */
.category-pills-container {
  margin-bottom: 30px;
  position: relative;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding: 12px 16px;
}
.pills-scroll-area {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pills-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.group-label {
  font-size: 11px;
  color: #999;
  font-weight: 700;
  padding: 6px 8px 6px 0;
  min-width: 36px;
  flex-shrink: 0;
  text-align: right;
  line-height: 1.5;
}
.pills-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
}
.pill {
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  white-space: nowrap;
}
.pill:hover {
  background: rgba(255, 255, 255, 0.6);
  color: #222;
}
.pill.active {
  background: linear-gradient(135deg, #fc3c44, #ff2d55);
  color: #fff;
  box-shadow: 0 2px 8px rgba(252, 60, 68, 0.4);
}
.pill small {
  font-size: 10px;
  opacity: 0.6;
  margin-left: 2px;
}

/* Playlist Grid */
.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 30px;
}

/* Music Card (Glassmorphism + Vinyl) */
.music-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  overflow: visible; /* Need visible for vinyl pop-out */
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}
.music-card:hover {
  transform: translateY(-8px);
  z-index: 10;
}

/* Cover & Vinyl */
.cover-wrapper {
  position: relative;
  width: calc(100% - 32px);
  margin: 16px 16px 0 16px;
  aspect-ratio: 1;
  z-index: 2;
}

.cover-inner {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  border-radius: 12px;
  overflow: hidden;
  z-index: 3;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  background: #f5f5f5;
}

.cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}
.music-card:hover .cover {
  transform: scale(1.05);
}

.vinyl-disc {
  position: absolute;
  top: 5%;
  left: 0;
  width: 90%;
  height: 90%;
  background: repeating-radial-gradient(
    #222, 
    #222 2px, 
    #111 3px, 
    #111 4px
  );
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  z-index: 2;
  transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  align-items: center;
  justify-content: center;
}
.vinyl-disc::after {
  content: '';
  width: 30%;
  height: 30%;
  border-radius: 50%;
  background: linear-gradient(135deg, #fc3c44, #ff2d55);
  border: 2px solid #111;
}
.music-card:hover .vinyl-disc {
  transform: translateX(40%) rotate(180deg);
}

.play-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.9);
  font-size: 48px;
  opacity: 0;
  z-index: 4;
  transition: opacity 0.3s;
}
.music-card:hover .play-overlay { opacity: 1; }

.bottom-bar {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  color: #fff;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 5;
}
.play-count { display: flex; align-items: center; gap: 4px; font-weight: 500; }
.fav-icon { font-size: 14px; transition: color 0.2s; }
.fav-icon:hover { color: #fc3c44; transform: scale(1.1); }
.fav-icon.is-active { color: #fc3c44; }

/* Info Section */
.card-info {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.title {
  font-size: 16px;
  font-weight: 700;
  color: #222;
  margin: 0 0 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.desc {
  font-size: 12px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.creator-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  margin-bottom: 12px;
}
.creator-name {
  font-size: 12px;
  color: #777;
  font-weight: 500;
}

.tags-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.tag-pill {
  font-size: 11px;
  color: #fc3c44;
  background: rgba(252, 60, 68, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 30px 0;
  width: 100%;
}
</style>
