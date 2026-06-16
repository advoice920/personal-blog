<template>
  <div class="max-w-screen-lg mx-auto px-4 py-5">
    <!-- ====== 个人信息头部 ====== -->
    <div class="profile-header">
      <!-- 封面背景 -->
      <div class="cover-bg" :style="{ background: coverGradient }">
        <button class="change-cover-btn" @click="showCoverPicker = !showCoverPicker">
          <el-icon :size="14"><Camera /></el-icon> 更换背景
        </button>
        <!-- 背景色选择器 -->
        <div v-if="showCoverPicker" class="cover-picker">
          <span v-for="opt in coverOptions" :key="opt.value" class="cover-color-dot" :style="{ background: opt.preview }" @click="setCover(opt)" :title="opt.label"></span>
        </div>
      </div>

      <!-- 用户信息主体 -->
      <div class="profile-info-body">
        <div class="profile-avatar-wrap">
          <el-avatar v-if="userInfo.avatar" :size="96" :src="userInfo.avatar" class="profile-avatar" />
          <el-avatar v-else :size="96" :icon="UserFilled" class="profile-avatar" />
          <span class="level-badge">{{ userInfo.level }}</span>
        </div>

        <div class="profile-details">
          <div class="name-row">
            <h2 class="profile-name">{{ userInfo.name }}</h2>
            <span class="online-dot" title="在线"></span>
          </div>
          <div class="skill-tags">
            <span class="skill-tag">Vue.js</span>
            <span class="skill-tag">React</span>
            <span class="skill-tag">Node.js</span>
            <span class="skill-tag">TypeScript</span>
            <span class="skill-tag">Tailwind</span>
            <span class="skill-tag more-tag">+3</span>
          </div>
          <div class="profile-stats">
            <div class="stat-item">
              <el-icon :size="18"><EditPen /></el-icon>
              <span class="stat-num">{{ myArticles.length }}</span>
              <span class="stat-label">文章</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <el-icon :size="18"><User /></el-icon>
              <span class="stat-num">3.2k</span>
              <span class="stat-label">粉丝</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <el-icon :size="18"><StarFilled /></el-icon>
              <span class="stat-num">56</span>
              <span class="stat-label">关注</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <el-icon :size="18"><TrendCharts /></el-icon>
              <span class="stat-num">8.5w</span>
              <span class="stat-label">获赞</span>
            </div>
          </div>
        </div>

        <!-- 近期访客 + 编辑 -->
        <div class="profile-right">
          <div class="visitor-mini">
            <div class="visitor-mini-avatars">
              <el-tooltip v-for="i in 5" :key="i" :content="visitorNames[i-1]" placement="top">
                <el-avatar :size="32" :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=visitor${i}`" class="visitor-mini-avatar" />
              </el-tooltip>
              <span class="visitor-mini-more">+13</span>
            </div>
            <span class="visitor-mini-label">近期访客</span>
          </div>
          <el-button type="primary" :icon="Edit" round size="small" @click="openEditDialog">编辑资料</el-button>
        </div>
      </div>
    </div>

    <!-- ====== 数据概览 ====== -->
    <div class="stats-overview">
      <div class="overview-card">
        <div class="overview-icon" style="background: rgba(252,60,68,0.1); color: #fc3c44;">
          <el-icon :size="22"><View /></el-icon>
        </div>
        <div class="overview-info">
          <span class="overview-num">{{ totalViews }}</span>
          <span class="overview-label">总阅读量</span>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon" style="background: rgba(245,158,11,0.1); color: #f59e0b;">
          <el-icon :size="22"><Star /></el-icon>
        </div>
        <div class="overview-info">
          <span class="overview-num">{{ totalLikes }}</span>
          <span class="overview-label">总获赞</span>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon" style="background: rgba(59,130,246,0.1); color: #3b82f6;">
          <el-icon :size="22"><ChatDotRound /></el-icon>
        </div>
        <div class="overview-info">
          <span class="overview-num">{{ totalComments }}</span>
          <span class="overview-label">总评论</span>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon" style="background: rgba(16,185,129,0.1); color: #10b981;">
          <el-icon :size="22"><TrendCharts /></el-icon>
        </div>
        <div class="overview-info">
          <span class="overview-num">{{ streakDays }}</span>
          <span class="overview-label">连续创作(天)</span>
        </div>
      </div>
    </div>

    <!-- ====== 功能卡片行 ====== -->
    <div class="info-cards-row">
      <!-- 个人简介 -->
      <div class="info-card">
        <h3 class="info-card-title"><el-icon><User /></el-icon> 个人简介</h3>
        <p class="bio-text">{{ userInfo.bio }}</p>
        <div class="bio-meta">
          <span><el-icon :size="14"><Location /></el-icon> 中国 · 上海</span>
          <span><el-icon :size="14"><Clock /></el-icon> 5 年前端经验</span>
        </div>
      </div>

      <!-- 我的喜欢 -->
      <div class="info-card">
        <h3 class="info-card-title"><el-icon><StarFilled /></el-icon> 我的喜欢</h3>
        <div class="mini-grid">
          <div class="mini-item">
            <span class="mini-icon">📄</span><span class="mini-name">文章</span>
            <span class="mini-num">{{ favoritesState.article?.length || 0 }}</span>
          </div>
          <div class="mini-item">
            <span class="mini-icon">🍜</span><span class="mini-name">美食</span>
            <span class="mini-num">{{ favoritesState.food?.length || 0 }}</span>
          </div>
          <div class="mini-item">
            <span class="mini-icon">🎬</span><span class="mini-name">电影</span>
            <span class="mini-num">{{ favoritesState.movie?.length || 0 }}</span>
          </div>
          <div class="mini-item">
            <span class="mini-icon">🎵</span><span class="mini-name">音乐</span>
            <span class="mini-num">{{ favoritesState.music?.length || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- 我的收藏 -->
      <div class="info-card">
        <h3 class="info-card-title"><el-icon><FolderOpened /></el-icon> 我的收藏</h3>
        <div class="mini-grid">
          <div class="mini-item">
            <span class="mini-icon">📷</span><span class="mini-name">摄影</span>
            <span class="mini-num">{{ favoritesState.photo?.length || 0 }}</span>
          </div>
          <div class="mini-item">
            <span class="mini-icon">✈️</span><span class="mini-name">旅行</span>
            <span class="mini-num">{{ favoritesState.travel?.length || 0 }}</span>
          </div>
          <div class="mini-item">
            <span class="mini-icon">📚</span><span class="mini-name">阅读</span>
            <span class="mini-num">{{ favoritesState.reading?.length || 0 }}</span>
          </div>
          <div class="mini-item">
            <span class="mini-icon">👗</span><span class="mini-name">穿搭</span>
            <span class="mini-num">{{ favoritesState.fashion?.length || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- 观看历史 -->
      <div class="info-card">
        <h3 class="info-card-title">
          <el-icon><Clock /></el-icon> 观看历史
          <router-link to="/history" class="info-card-link">全部 →</router-link>
        </h3>
        <div v-if="recentHistory.length > 0" class="history-list">
          <div v-for="item in recentHistory" :key="item.id" class="history-item">
            <span class="history-type">{{ item.type }}</span>
            <span class="history-title">{{ item.title }}</span>
          </div>
        </div>
        <div v-else class="sidebar-empty">
          <span>暂无浏览记录</span>
        </div>
      </div>
    </div>

    <!-- ====== 文章内容区（全宽） ====== -->
    <div class="content-card">
          <el-tabs v-model="activeTab" class="profile-tabs">
            <el-tab-pane name="published">
              <template #label>
                <span class="tab-label">
                  <el-icon :size="16"><EditPen /></el-icon> 发布的文章
                  <span class="tab-count">{{ myArticles.length }}</span>
                </span>
              </template>
            </el-tab-pane>
            <el-tab-pane name="drafts">
              <template #label>
                <span class="tab-label">
                  <el-icon :size="16"><Edit /></el-icon> 草稿箱
                  <span class="tab-count">{{ drafts.length }}</span>
                </span>
              </template>
            </el-tab-pane>
          </el-tabs>

          <!-- 发布的文章 -->
          <div v-if="activeTab === 'published'">
            <div v-if="myArticles.length === 0" class="empty-state">
              <el-icon :size="48"><EditPen /></el-icon>
              <p>还没有发布过文章</p>
              <el-button type="primary" round @click="$router.push('/editor')">开始创作</el-button>
            </div>
            <div v-else class="article-list">
              <div v-for="article in myArticles" :key="article.id" class="article-card-h">
                <router-link :to="'/post/' + article.id" class="card-h-link">
                  <div class="card-h-cover">
                    <img v-if="article.thumbnail || article.cover" :src="article.thumbnail || article.cover" :alt="article.title" />
                    <div v-else class="card-h-cover-placeholder">
                      <el-icon :size="32"><Document /></el-icon>
                    </div>
                    <span class="card-h-category">{{ article.category || '文章' }}</span>
                  </div>
                  <div class="card-h-body">
                    <h3 class="card-h-title">{{ article.title }}</h3>
                    <p class="card-h-summary" v-if="article.summary">{{ article.summary }}</p>
                    <div class="card-h-meta">
                      <span>{{ formatDate(article.createdAt) }}</span>
                      <span class="meta-divider">·</span>
                      <span><el-icon :size="13"><View /></el-icon> {{ article.views || 0 }}</span>
                      <span class="meta-divider">·</span>
                      <span><el-icon :size="13"><Star /></el-icon> {{ article.likes || 0 }}</span>
                    </div>
                  </div>
                </router-link>
                <div class="card-h-actions">
                  <el-button text size="small" :icon="Edit" @click="openArticleEdit(article)">编辑</el-button>
                  <el-button text size="small" type="danger" :icon="Delete" @click="handleDelete(article)">删除</el-button>
                </div>
              </div>
            </div>
            <div class="flex justify-center py-6" v-if="totalMy > 10">
              <el-pagination v-model:current-page="currentPage" :page-size="10" :total="totalMy" layout="prev, pager, next" background @current-change="loadMyArticles" />
            </div>
          </div>

          <!-- 草稿箱 -->
          <div v-if="activeTab === 'drafts'">
            <div class="empty-state">
              <el-icon :size="48"><Edit /></el-icon>
              <p>草稿箱为空</p>
              <p class="empty-hint">编辑中的文章会自动保存到草稿箱</p>
            </div>
          </div>
        </div>

    <!-- ====== 编辑资料弹窗 ====== -->
    <el-dialog v-model="editDialogVisible" title="编辑个人资料" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="头像">
          <el-upload class="avatar-uploader" action="#" :show-file-list="false" :auto-upload="false" :on-change="handleAvatarChange">
            <img v-if="editForm.avatar" :src="editForm.avatar" class="w-20 h-20 rounded-full object-cover" />
            <el-icon v-else class="avatar-uploader-icon w-20 h-20 border border-dashed border-gray-300 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-500 cursor-pointer"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="editForm.name" placeholder="请输入昵称" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="个人介绍">
          <el-input v-model="editForm.bio" type="textarea" placeholder="请输入个人介绍" maxlength="100" show-word-limit :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProfile">保存</el-button>
      </template>
    </el-dialog>

    <!-- ====== 编辑文章弹窗 ====== -->
    <el-dialog v-model="articleEditVisible" title="编辑文章" width="700px" top="5vh">
      <el-form :model="articleEditForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="articleEditForm.title" placeholder="文章标题" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="articleEditForm.category">
            <el-option label="科技" value="科技" />
            <el-option label="商业" value="商业" />
            <el-option label="生活" value="生活" />
            <el-option label="阅读" value="阅读" />
            <el-option label="数码" value="数码" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="摘要">
          <el-input v-model="articleEditForm.summary" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="正文">
          <el-input v-model="articleEditForm.content" type="textarea" :rows="10" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="articleEditVisible = false">取消</el-button>
        <el-button type="primary" @click="saveArticle">保存修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { UserFilled, Edit, Delete, Plus, EditPen, User, StarFilled, TrendCharts, Document, View, Star, Food, Film, Headset, Camera, Reading, Location, ChatDotRound, Clock, FolderOpened } from '@element-plus/icons-vue'
import axios from 'axios'
import { getUserProfile, updateUserProfile, uploadImage } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { favoritesState } from '@/store/favorites.js'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// --- User Info ---
const userInfo = reactive({
  avatar: '',
  name: '前端小徐',
  level: 'LV.5',
  bio: '热爱前端开发，专注于 Vue 生态 | 5 年经验 | 全栈探索中'
})

// --- 封面背景 ---
const coverGradient = ref('linear-gradient(135deg, #fc3c44 0%, #ff6b6b 25%, #ff8e53 50%, #ffb347 75%, #fad390 100%)')
const showCoverPicker = ref(false)
const coverOptions = [
  { label: '日落暖橙', value: 'warm', gradient: 'linear-gradient(135deg, #fc3c44 0%, #ff6b6b 25%, #ff8e53 50%, #ffb347 75%, #fad390 100%)', preview: 'linear-gradient(135deg, #fc3c44, #ffb347)' },
  { label: '海洋蓝', value: 'ocean', gradient: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 30%, #3b82f6 60%, #6366f1 100%)', preview: 'linear-gradient(135deg, #0ea5e9, #6366f1)' },
  { label: '森林绿', value: 'forest', gradient: 'linear-gradient(135deg, #059669 0%, #10b981 35%, #34d399 60%, #6ee7b7 100%)', preview: 'linear-gradient(135deg, #059669, #34d399)' },
  { label: '星空紫', value: 'purple', gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 30%, #c084fc 60%, #e9d5ff 100%)', preview: 'linear-gradient(135deg, #7c3aed, #c084fc)' },
  { label: '暗夜黑', value: 'dark', gradient: 'linear-gradient(135deg, #1e293b 0%, #334155 30%, #475569 60%, #64748b 100%)', preview: 'linear-gradient(135deg, #1e293b, #475569)' },
  { label: '樱花粉', value: 'pink', gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 30%, #f9a8d4 60%, #fce7f3 100%)', preview: 'linear-gradient(135deg, #ec4899, #f9a8d4)' },
]
const setCover = (opt) => {
  coverGradient.value = opt.gradient
  showCoverPicker.value = false
}

const editDialogVisible = ref(false)
const editForm = reactive({ avatar: '', name: '', bio: '', rawAvatarFile: null })

const loadProfile = async () => {
  const res = await getUserProfile()
  if (res && res.data) {
    const user = res.data
    userInfo.name = user.username || user.email?.split('@')[0] || '前端小徐'
    if (user.avatar) userInfo.avatar = user.avatar
    if (user.bio) userInfo.bio = user.bio
  }
}

const openEditDialog = () => {
  editForm.avatar = userInfo.avatar
  editForm.name = userInfo.name
  editForm.bio = userInfo.bio
  editForm.rawAvatarFile = null
  editDialogVisible.value = true
}

const handleAvatarChange = (uploadFile) => {
  if (uploadFile.raw) {
    editForm.rawAvatarFile = uploadFile.raw
    editForm.avatar = URL.createObjectURL(uploadFile.raw)
  }
}

const saveProfile = async () => {
  let finalAvatarUrl = userInfo.avatar
  if (editForm.rawAvatarFile) {
    try {
      const uploadRes = await uploadImage(editForm.rawAvatarFile)
      if (uploadRes && uploadRes.data && uploadRes.data.url) {
        const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace('/api', '')
        finalAvatarUrl = baseUrl + uploadRes.data.url
      } else {
        ElMessage.error(uploadRes?.msg || '头像上传失败')
        return
      }
    } catch (e) {
      ElMessage.error('头像上传异常')
      return
    }
  }
  const updateRes = await updateUserProfile({ username: editForm.name, avatar: finalAvatarUrl, bio: editForm.bio })
  if (updateRes && (updateRes.code === 200 || updateRes.code === 201)) {
    ElMessage.success('资料保存成功')
    userInfo.avatar = finalAvatarUrl
    userInfo.name = editForm.name
    userInfo.bio = editForm.bio
    editDialogVisible.value = false
  } else {
    ElMessage.error(updateRes?.msg || '资料保存失败')
  }
}

// --- My Articles ---
const activeTab = ref('published')
const currentPage = ref(1)
const totalMy = ref(0)
const myArticles = ref([])

const loadMyArticles = async () => {
  try {
    const res = await axios.get(`${API_BASE}/rss/articles`, {
      params: { page: currentPage.value, limit: 10, mine: '1' }
    })
    if (res.data?.code === 200) {
      myArticles.value = res.data.data.items || []
      totalMy.value = res.data.data.total || 0
    }
  } catch (e) {
    console.error('Load my articles error:', e)
  }
}

const handleDelete = async (article) => {
  try {
    await ElMessageBox.confirm(`确定删除「${article.title}」？`, '确认删除', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
    })
    await axios.delete(`${API_BASE}/articles/${article.id}`)
    ElMessage.success('已删除')
    loadMyArticles()
  } catch (e) {
    if (e !== 'cancel') { console.error('Delete error:', e); ElMessage.error('删除失败') }
  }
}

// --- Edit Article ---
const articleEditVisible = ref(false)
const editingArticleId = ref(null)
const articleEditForm = reactive({ title: '', category: '科技', summary: '', content: '' })

const openArticleEdit = (article) => {
  editingArticleId.value = article.id
  articleEditForm.title = article.title
  articleEditForm.category = article.category || '科技'
  articleEditForm.summary = article.summary || ''
  articleEditForm.content = article.content || ''
  articleEditVisible.value = true
}

const saveArticle = async () => {
  try {
    await axios.put(`${API_BASE}/articles/${editingArticleId.value}`, {
      title: articleEditForm.title, category: articleEditForm.category,
      summary: articleEditForm.summary, content: articleEditForm.content
    })
    ElMessage.success('修改已保存')
    articleEditVisible.value = false
    loadMyArticles()
  } catch (e) { console.error('Save article error:', e); ElMessage.error('保存失败') }
}

// --- Stats ---
const totalViews = computed(() => myArticles.value.reduce((s, a) => s + (a.views || 0), 0).toLocaleString())
const totalLikes = computed(() => myArticles.value.reduce((s, a) => s + (a.likes || 0), 0).toLocaleString())
const totalComments = computed(() => myArticles.value.reduce((s, a) => s + (a.comments || 0), 0).toLocaleString())
const streakDays = ref(7)

// --- Favorites ---
const favCategories = computed(() => [
  { label: '文章', value: 'article', count: favoritesState.article?.length || 0, icon: Document },
  { label: '美食', value: 'food', count: favoritesState.food?.length || 0, icon: Food },
  { label: '电影', value: 'movie', count: favoritesState.movie?.length || 0, icon: Film },
  { label: '音乐', value: 'music', count: favoritesState.music?.length || 0, icon: Headset },
  { label: '摄影', value: 'photo', count: favoritesState.photo?.length || 0, icon: Camera },
  { label: '阅读', value: 'reading', count: favoritesState.reading?.length || 0, icon: Reading },
])
const totalFavCount = computed(() => favCategories.value.reduce((s, c) => s + c.count, 0))

// --- Visitors ---
const visitorNames = ['小王', '小李', '前端张', '设计师阿琳', '后端老陈', '全栈小明', '产品喵', '测试大侠', '运维阿强']

// --- History ---
const recentHistory = ref([])

// --- Drafts ---
const drafts = ref([])

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

onMounted(() => {
  loadProfile()
  loadMyArticles()
})
</script>

<style scoped>
/* ====== 个人信息头部 ====== */
.profile-header {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.cover-bg {
  height: 140px;
  position: relative;
  overflow: hidden;
  transition: background 0.5s ease;
}
.cover-bg::before {
  content: '';
  position: absolute;
  top: -50%; right: -20%;
  width: 300px; height: 300px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}
.cover-bg::after {
  content: '';
  position: absolute;
  bottom: -30%; left: 10%;
  width: 200px; height: 200px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
}

.change-cover-btn {
  position: absolute;
  bottom: 12px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 14px;
  background: rgba(0,0,0,0.2);
  backdrop-filter: blur(6px);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
  z-index: 2;
}
.change-cover-btn:hover { background: rgba(0,0,0,0.35); }

.cover-picker {
  position: absolute;
  bottom: 44px;
  right: 16px;
  display: flex;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255,255,255,0.9);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  z-index: 3;
}
.cover-color-dot {
  width: 24px; height: 24px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  transition: border-color 0.2s, transform 0.2s;
}
.cover-color-dot:hover {
  border-color: #333;
  transform: scale(1.2);
}

/* 用户信息主体 */
.profile-info-body {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 24px 20px;
  position: relative;
}

.profile-avatar-wrap {
  position: relative;
  margin-top: -48px;
  flex-shrink: 0;
}
.profile-avatar {
  border: 4px solid #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border-radius: 50%;
}
.level-badge {
  position: absolute;
  bottom: -2px; right: -4px;
  background: linear-gradient(135deg, #ffb347, #ff8e53);
  color: #fff;
  font-size: 11px; font-weight: 700;
  padding: 2px 8px; border-radius: 10px;
  border: 2px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.profile-details {
  flex: 1; min-width: 0; padding-top: 8px;
}
.name-row {
  display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
}
.profile-name {
  margin: 0; font-size: 22px; font-weight: 700; color: #1a1a1a;
}
.online-dot {
  width: 9px; height: 9px; border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
}

.skill-tags {
  display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px;
}
.skill-tag {
  font-size: 12px; padding: 3px 10px; border-radius: 12px;
  background: rgba(252, 60, 68, 0.08); color: #fc3c44; font-weight: 500;
}
.more-tag { background: rgba(0, 0, 0, 0.05); color: #999; }

.profile-stats {
  display: flex; align-items: center; gap: 0;
}
.stat-item {
  display: flex; align-items: center; gap: 6px; color: #666;
}
.stat-num { font-size: 16px; font-weight: 700; color: #1a1a1a; }
.stat-label { font-size: 12px; color: #999; }
.stat-divider {
  width: 1px; height: 20px; background: #e8e8e8; margin: 0 18px;
}

/* 右侧：访客 + 编辑 */
.profile-right {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  padding-top: 8px;
}
.visitor-mini {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.visitor-mini-avatars {
  display: flex; align-items: center;
}
.visitor-mini-avatar {
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  margin-left: -8px;
  cursor: pointer;
  transition: transform 0.2s;
}
.visitor-mini-avatar:first-child { margin-left: 0; }
.visitor-mini-avatar:hover { transform: translateY(-2px); z-index: 2; }
.visitor-mini-more {
  display: inline-flex;
  align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(0,0,0,0.04); font-size: 11px; font-weight: 600;
  color: #999; border: 2px solid #fff; margin-left: -8px;
}
.visitor-mini-label {
  font-size: 11px; color: #bbb;
}

/* ====== 数据概览 ====== */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
.overview-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 14px;
  padding: 16px 20px;
  display: flex; align-items: center; gap: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s;
}
.overview-card:hover { transform: translateY(-2px); }
.overview-icon {
  width: 46px; height: 46px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.overview-num { font-size: 22px; font-weight: 700; color: #1a1a1a; }
.overview-label { font-size: 12px; color: #999; }

/* ====== 功能卡片行 ====== */
.info-cards-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
.info-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s;
}
.info-card:hover { transform: translateY(-2px); }
.info-card-title {
  margin: 0 0 12px;
  font-size: 14px; font-weight: 600; color: #333;
  display: flex; align-items: center; gap: 6px;
}
.info-card-link {
  margin-left: auto; font-size: 12px; color: #999;
  text-decoration: none; font-weight: 400;
}
.info-card-link:hover { color: #fc3c44; }

/* 个人简介 */
.bio-text {
  margin: 0 0 12px; font-size: 13px; color: #666; line-height: 1.7;
}
.bio-meta {
  display: flex; flex-direction: column; gap: 6px;
  font-size: 12px; color: #aaa;
}
.bio-meta span {
  display: flex; align-items: center; gap: 4px;
}

/* 迷你网格(喜欢/收藏) */
.mini-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.mini-item {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px;
  background: rgba(255,255,255,0.5);
  border-radius: 10px;
  transition: background 0.2s;
  cursor: pointer;
}
.mini-item:hover { background: rgba(255,255,255,0.8); }
.mini-icon { font-size: 18px; }
.mini-name { font-size: 13px; color: #555; flex: 1; }
.mini-num { font-size: 14px; font-weight: 700; color: #fc3c44; }

/* 历史 */
.sidebar-empty {
  text-align: center; padding: 16px 0; font-size: 13px; color: #ccc;
}
.history-list {
  display: flex; flex-direction: column; gap: 8px;
}
.history-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0,0,0,0.04);
  cursor: pointer;
}
.history-item:last-child { border-bottom: none; }
.history-type {
  font-size: 11px; color: #fc3c44; font-weight: 600;
  background: rgba(252,60,68,0.08);
  padding: 2px 6px; border-radius: 4px;
}
.history-title {
  font-size: 13px; color: #555;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.content-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  padding: 8px 24px 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.profile-tabs :deep(.el-tabs__header) { margin-bottom: 8px; }
.profile-tabs :deep(.el-tabs__nav-wrap::after) { height: 1px; background: rgba(0, 0, 0, 0.06); }
.tab-label { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; }
.tab-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; height: 18px; padding: 0 6px; border-radius: 9px;
  font-size: 11px; font-weight: 600;
  background: rgba(0, 0, 0, 0.06); color: #888; margin-left: 2px;
}
.profile-tabs :deep(.el-tabs__item.is-active .tab-count) {
  background: rgba(252, 60, 68, 0.1); color: #fc3c44;
}

.empty-state { text-align: center; padding: 60px 20px; color: #bbb; }
.empty-state .el-icon { margin-bottom: 12px; }
.empty-state p { margin: 0 0 16px; font-size: 15px; }
.empty-hint { font-size: 13px !important; color: #ccc !important; }

/* 文章列表（横向长方形卡片） */
.article-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.article-card-h {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  display: flex; align-items: stretch;
  overflow: hidden;
}
.article-card-h:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.07); }

.card-h-link {
  text-decoration: none; color: inherit;
  display: flex; flex: 1; min-width: 0;
}

.card-h-cover {
  position: relative;
  width: 200px; flex-shrink: 0;
  min-height: 130px;
  overflow: hidden; background: #f0f1f3;
}
.card-h-cover img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.4s;
}
.article-card-h:hover .card-h-cover img { transform: scale(1.04); }
.card-h-cover-placeholder {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #f5f6f7, #e8eaed); color: #ccc;
}
.card-h-category {
  position: absolute; top: 8px; left: 8px;
  font-size: 11px; font-weight: 600; color: #fff;
  background: rgba(0, 0, 0, 0.55); backdrop-filter: blur(4px);
  padding: 2px 8px; border-radius: 8px;
}

.card-h-body {
  padding: 16px 18px;
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; justify-content: center;
}
.card-h-title {
  margin: 0 0 6px;
  font-size: 16px; font-weight: 600; color: #1a1a1a;
  line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
}
.card-h-summary {
  margin: 0 0 10px;
  font-size: 13px; color: #888; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.card-h-meta {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #aaa;
}
.card-h-meta span {
  display: flex; align-items: center; gap: 3px;
}
.meta-divider { color: #ddd; }

.card-h-actions {
  display: flex; flex-direction: column; justify-content: center; gap: 4px;
  padding: 0 16px; border-left: 1px solid rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
}

/* 收藏夹 */
.fav-overview { padding: 8px 0; }
.fav-category-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 14px;
}
.fav-cat-card {
  display: flex; align-items: center; gap: 14px; padding: 16px;
  background: rgba(255, 255, 255, 0.6); border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 0.2s; cursor: pointer;
}
.fav-cat-card:hover { background: rgba(255, 255, 255, 0.85); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05); transform: translateY(-1px); }
.fav-cat-icon {
  width: 50px; height: 50px; border-radius: 12px;
  background: linear-gradient(135deg, rgba(252, 60, 68, 0.1), rgba(255, 107, 107, 0.1));
  display: flex; align-items: center; justify-content: center; color: #fc3c44; flex-shrink: 0;
}
.fav-cat-info { display: flex; flex-direction: column; gap: 2px; }
.fav-cat-name { font-size: 14px; font-weight: 600; color: #333; }
.fav-cat-count { font-size: 12px; color: #999; }

/* ====== 响应式 ====== */
@media (max-width: 1000px) {
  .info-cards-row { grid-template-columns: repeat(2, 1fr); }
  .stats-overview { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .cover-bg { height: 100px; }
  .profile-info-body { flex-direction: column; align-items: center; text-align: center; padding: 0 16px 16px; }
  .profile-avatar-wrap { margin-top: -40px; }
  .profile-stats { justify-content: center; flex-wrap: wrap; gap: 10px; }
  .stat-divider { margin: 0 10px; }
  .profile-right { align-items: center; }
  .skill-tags { justify-content: center; }
  .name-row { justify-content: center; }
  .card-h-cover { width: 140px; min-height: 110px; }
  .card-h-body { padding: 12px 14px; }
  .card-h-title { font-size: 14px; }
  .card-h-summary { -webkit-line-clamp: 1; }
  .card-h-actions { padding: 0 10px; }
}
@media (max-width: 480px) {
  .cover-bg { height: 80px; }
  .profile-name { font-size: 18px; }
  .stat-divider { display: none; }
  .profile-stats { gap: 14px; }
  .stats-overview { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .overview-card { padding: 12px 14px; }
  .overview-num { font-size: 18px; }
  .info-cards-row { grid-template-columns: 1fr; }
  .content-card { padding: 8px 12px 16px; }
  .mini-grid { grid-template-columns: 1fr 1fr; }
  .article-card-h { flex-direction: column; }
  .card-h-link { flex-direction: column; }
  .card-h-cover { width: 100%; height: 150px; min-height: auto; }
  .card-h-actions { flex-direction: row; border-left: none; border-top: 1px solid rgba(0,0,0,0.04); padding: 10px 16px; }
}
</style>
