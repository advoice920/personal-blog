<template>
  <header class="navbar">
    <div class="navbar-inner">
      <!-- 首页专属：左侧分类区 -->
      <div v-if="isHome" class="nav-categories">
        <span
          v-for="cat in categories"
          :key="cat.value"
          :class="['nav-tab', { active: activeCat === cat.value }]"
          @click="selectCat(cat.value)"
        >{{ cat.label }}</span>
      </div>

      <!-- 其他页面专属：页面标题区 -->
      <div v-else class="page-title-area">
        <div class="back-btn" @click="router.back()" title="返回">
          <el-icon><ArrowLeft /></el-icon>
        </div>
        <span class="page-title">{{ route.meta.title || 'LiveBlog' }}</span>
      </div>

      <!-- 首页专属：搜索区 - 居中 -->
      <div v-if="isHome" class="search-area">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索内容"
          :prefix-icon="Search"
          size="default"
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #suffix>
            <span class="ai-badge">Search</span>
          </template>
        </el-input>
      </div>

      <!-- 占位符，用于非首页时保持右侧操作区靠右 -->
      <div v-else class="search-area-placeholder"></div>

      <!-- 右侧操作区 -->
      <div class="actions">
        <router-link v-if="isHome" to="/editor" class="create-btn">
          <el-icon :size="18"><EditPen /></el-icon>
          <span>创作</span>
        </router-link>

        <el-badge :value="5" :max="99" class="action-item" @click="router.push('/notifications')">
          <el-icon :size="20"><Bell /></el-icon>
        </el-badge>

        <el-dropdown trigger="hover" placement="bottom-end">
          <el-avatar :size="32" :src="userInfo.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest'" :icon="UserFilled" class="avatar" />
          <template #dropdown>
            <el-dropdown-menu v-if="isLoggedIn">
              <el-dropdown-item>
                <router-link to="/profile" class="dropdown-link">我的主页</router-link>
              </el-dropdown-item>
              <el-dropdown-item>
                <router-link to="/history" class="dropdown-link">浏览历史</router-link>
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">
                <span class="dropdown-link">登出</span>
              </el-dropdown-item>
            </el-dropdown-menu>
            <el-dropdown-menu v-else>
              <el-dropdown-item>
                <router-link to="/login" class="dropdown-link">登录</router-link>
              </el-dropdown-item>
              <el-dropdown-item>
                <router-link to="/register" class="dropdown-link">注册</router-link>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, Bell, EditPen, UserFilled, ArrowLeft } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const searchKeyword = ref(route.query.q || '')

const isLoggedIn = ref(!!localStorage.getItem('token') || !!localStorage.getItem('mockToken'))
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

const handleSearch = () => {
  if (!searchKeyword.value.trim()) return
  // Instead of a dedicated search page, let's trigger search on the current tab by passing ?q=
  router.push({ path: '/', query: { ...route.query, q: searchKeyword.value } })
}

const isHome = computed(() => route.path === '/')

const activeCat = computed(() => {
  return route.query.cat || 'article'
})

const selectCat = (val) => {
  if (activeCat.value === val) return
  if (val === 'article') {
    router.push({ path: '/' }) // Article is the default /all view
  } else {
    router.push({ path: '/', query: { cat: val } })
  }
}

const categories = [
  { label: '文章', value: 'article' },
  { label: '美食', value: 'food' },
  { label: '旅行', value: 'travel' },
  { label: '摄影', value: 'photo' },
  { label: '读书', value: 'reading' },
  { label: '音乐', value: 'music' },
  { label: '电影', value: 'movie' },
  { label: '运动', value: 'sports' },
  { label: '穿搭', value: 'fashion' },
]

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('mockToken')
  localStorage.removeItem('userInfo')
  isLoggedIn.value = false
  userInfo.value = {}
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 200px;
  right: 0;
  z-index: 999;
  height: 56px;
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 1px 12px rgba(0,0,0,0.05);
}

.navbar-inner {
  max-width: none;
  margin: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

/* 分类区 */
.nav-categories {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  overflow-x: auto;
}
.nav-categories::-webkit-scrollbar { display: none; }
.nav-tab {
  font-size: 15px;
  color: #333;
  cursor: pointer;
  transition: color 0.2s;
  white-space: nowrap;
}
.nav-tab:hover { color: #fc3c44; }
.nav-tab.active { color: #fc3c44; font-weight: 600; }

/* 页面标题区 */
.page-title-area {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}
.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
}
.back-btn:hover {
  background: rgba(255, 255, 255, 0.8);
  color: #fc3c44;
}
.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  letter-spacing: 0.5px;
  background: linear-gradient(90deg, #333, #666);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 搜索 - 居中 */
.search-area {
  flex: 1;
  display: flex;
  justify-content: center;
  min-width: 200px;
}
.search-area-placeholder {
  flex: 1;
}
.search-input {
  width: 100%;
  max-width: 460px;
}
.search-input :deep(.el-input__wrapper) {
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: none;
  padding: 0 12px;
  backdrop-filter: blur(8px);
}
.search-input :deep(.el-input__wrapper:hover) {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(255, 255, 255, 0.8);
}
.search-input :deep(.el-input__wrapper.is-focus) {
  background: rgba(255, 255, 255, 0.8);
  border-color: #fc3c44;
}
.ai-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: 1px 6px;
  border-radius: 4px;
}

/* 操作区 */
.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  flex: 1;
}

/* 创作按钮 */
.create-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #fc3c44, #ff2d55);
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(252, 60, 68, 0.35);
}
.create-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(252, 60, 68, 0.45);
}

.action-item {
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
  display: flex;
  align-items: center;
}
.action-item:hover { color: #fc3c44; }
.avatar { cursor: pointer; border: 2px solid transparent; transition: border-color 0.2s; }
.avatar:hover { border-color: #fc3c44; }
.dropdown-link { text-decoration: none; color: inherit; display: block; width: 100%; }

@media (max-width: 768px) {
  .search-area {
    position: static;
    transform: none;
    flex: 1;
    margin: 0 12px;
  }
  .navbar-inner { justify-content: space-between; }
}
</style>
