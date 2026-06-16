<template>
  <div class="vibe-page-container">
    <div class="vibe-header-area">
      <h1 class="vibe-title">My Footprints 👣</h1>
      <p class="vibe-subtitle">回顾你的浏览轨迹，发现新的灵感。</p>
      <div style="text-align: center; margin-top: 16px;" v-if="historyList.length > 0">
        <el-button type="danger" size="small" @click="handleClearHistory" plain>
          清空全部历史
        </el-button>
      </div>
    </div>

    <main class="main-content">
      <div class="vibe-card" v-if="historyList.length === 0">
        <el-empty description="暂无浏览记录" />
      </div>
      <div class="history-grid" v-else>
        <div class="history-item" v-for="item in historyList" :key="item.id" @click="goToItem(item)">
          <div class="history-cover">
            <img :src="item.cover" alt="cover" />
            <span class="module-badge">{{ getModuleName(item.module_name) }}</span>
            <div class="delete-btn" @click.stop="handleDelete(item)">
              <el-icon><Close /></el-icon>
            </div>
          </div>
          <div class="history-info">
            <h3 class="title">{{ item.title }}</h3>
            <p class="time">{{ formatTime(item.created_at) }}</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getHistory, clearHistory, deleteHistory } from '@/api/index.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Close } from '@element-plus/icons-vue'

const router = useRouter()
const historyList = ref([])

onMounted(async () => {
  await fetchHistory()
})

async function fetchHistory() {
  const data = await getHistory({ limit: 50 })
  historyList.value = data.items || []
}

async function handleClearHistory() {
  try {
    await ElMessageBox.confirm('确定要清空所有浏览记录吗？', '提示', { type: 'warning' })
    await clearHistory()
    ElMessage.success('历史记录已清空')
    historyList.value = []
  } catch(e) {}
}

async function handleDelete(item) {
  try {
    await deleteHistory(item.id)
    ElMessage.success('删除成功')
    await fetchHistory()
  } catch(e) {
    ElMessage.error('删除失败')
  }
}

function getModuleName(name) {
  const map = {
    'articles': '文章',
    'music': '音乐',
    'movie': '电影',
    'travel': '旅行',
    'photo': '摄影',
    'food': '美食',
    'reading': '阅读',
    'sports': '运动',
    'fashion': '时尚'
  }
  return map[name] || name
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function goToItem(item) {
  if (item.module_name === 'articles') {
    router.push(`/post/${item.item_id}`)
  } else if (item.module_name === 'music') {
    router.push(`/playlist/${item.item_id}`)
  } else {
    // For other modules, route to home with category
    router.push(`/?tab=${item.module_name}`)
  }
}
</script>

<style scoped>
.vibe-page-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 24px;
}
.vibe-header-area {
  margin-bottom: 40px;
  text-align: center;
}
.vibe-title {
  font-size: 32px;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0 0 12px 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', sans-serif;
}
.vibe-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}
.vibe-card {
  background: #fff;
  border-radius: 24px;
  padding: 60px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}
.history-item {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: transform 0.2s;
}
.history-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}
.history-cover {
  width: 100%;
  height: 140px;
  position: relative;
  background: #f5f5f5;
}
.history-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.module-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}
.delete-btn {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0,0,0,0.4);
  color: #fff;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.3s;
}
.delete-btn:hover {
  background: rgba(255,0,0,0.8);
  transform: scale(1.1);
}
.history-item:hover .delete-btn {
  opacity: 1;
}
.history-info {
  padding: 12px;
}
.history-info .title {
  font-size: 14px;
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #333;
}
.history-info .time {
  font-size: 12px;
  color: #999;
  margin: 0;
}
</style>
