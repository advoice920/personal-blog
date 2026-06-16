<template>
  <div class="post-detail-page">
    <div class="three-column-layout">
      <!-- ===== 左侧：作者信息 ===== -->
      <aside class="left-sidebar glass-panel">
        <div class="author-card">
          <el-avatar :size="56" :icon="UserFilled" class="author-avatar" />
          <h2 class="author-name">{{ article.author.name }}</h2>
          <el-tag size="small" type="warning">LV.5</el-tag>
          <div class="author-stats">
            <div class="stat-item"><span class="stat-val">128</span><span class="stat-label">文章</span></div>
            <div class="stat-item"><span class="stat-val">45.5k</span><span class="stat-label">阅读</span></div>
            <div class="stat-item"><span class="stat-val">8k</span><span class="stat-label">获赞</span></div>
          </div>
          <el-button class="follow-btn" :type="followed ? 'info' : 'primary'" round size="small" @click="followed = !followed">
            {{ followed ? "已关注" : "关注作者" }}
          </el-button>
        </div>

        <div class="action-list">
          <div class="action-item" :class="{ active: liked }" @click="liked = !liked">
            <div class="icon-wrap"><el-icon :size="20"><StarFilled v-if="liked" /><Star v-else /></el-icon></div>
            <span class="action-label">{{ likeCount }} 赞</span>
          </div>
          <div class="action-item" :class="{ active: collected }" @click="handleCollect">
            <div class="icon-wrap"><el-icon :size="20"><Collection v-if="collected" /><FolderChecked v-else /></el-icon></div>
            <span class="action-label">收藏</span>
          </div>
          <div class="action-item" @click="sharePost">
            <div class="icon-wrap"><el-icon :size="20"><Share /></el-icon></div>
            <span class="action-label">分享</span>
          </div>
        </div>

        <div class="toc-widget">
          <h3 class="side-title">📑 文章目录</h3>
          <ul class="toc-list">
            <li class="toc-item active"><span class="toc-dot"></span>繁华中的宁静</li>
            <li class="toc-item"><span class="toc-dot"></span>历史与现代的交融</li>
            <li class="toc-item"><span class="toc-dot"></span>瞬间的永恒定格</li>
            <li class="toc-item"><span class="toc-dot"></span>旅行随想与总结</li>
          </ul>
        </div>
      </aside>

      <!-- ===== 中间：文章阅读区（固定高度可滚动） ===== -->
      <main class="main-content glass-panel">
        <div class="post-header">
          <div v-if="isApiData" class="api-badge">天行API数据</div>
          <h1 class="post-title">{{ article.title }}</h1>
          <div class="post-meta">
            <span>发布于 {{ article.createdAt || '2026-06-05' }}</span>
            <span>·</span>
            <span>阅读 {{ formatNum(article.views || 45500) }}</span>
          </div>
          <div class="post-tags" v-if="article.tags && article.tags.length">
            <el-tag v-for="tag in article.tags" :key="tag" size="small" class="tag-glass">{{ tag }}</el-tag>
          </div>
        </div>

        <!-- 文章正文 - 固定高度可滚动 -->
        <div class="post-body">
          <div v-if="article.url" class="original-link-bar">
            <el-button type="primary" plain size="small" @click="goToOriginal(article.url)">
              <el-icon style="margin-right:4px"><Link /></el-icon> 阅读原文
            </el-button>
          </div>

          <template v-if="article.content">
            <div v-if="isHtmlContent" class="article-content scraped-html" v-html="proxiedContent"></div>
            <div v-else class="article-content">
              <MdPreview :modelValue="article.content" />
            </div>
          </template>
          <template v-else-if="article.url && !scrapedContent">
            <div class="loading-card">
              <p>正在抓取正文...</p>
              <el-button type="info" size="large" @click="goToOriginal(article.url)">直接前往原文</el-button>
            </div>
          </template>
          <template v-else-if="scrapedContent === 'iframe'">
            <iframe :src="article.url" class="article-iframe"></iframe>
          </template>
          <template v-else-if="scrapedContent">
            <div class="article-content scraped-html" v-html="scrapedContent"></div>
            <div class="original-link-bar" style="justify-content:center; margin-top:20px">
              <el-button type="info" size="small" plain @click="goToOriginal(article.url)">查看原文链接</el-button>
            </div>
          </template>
          <template v-else>
            <div class="loading-card"><p>内容加载中...</p></div>
          </template>
        </div>
      </main>

      <!-- ===== 右侧：标签云 + AI助手 ===== -->
      <aside class="right-sidebar">
        <div class="tag-cloud-widget glass-panel">
          <h3 class="side-title">🔖 探索标签</h3>
          <div class="tags-container">
            <span class="cloud-tag t-size-lg" style="--tag-color:#fc3c44">前端生态</span>
            <span class="cloud-tag t-size-md" style="--tag-color:#4facfe">Vue3</span>
            <span class="cloud-tag t-size-sm" style="--tag-color:#8b5cf6">Vite构建</span>
            <span class="cloud-tag t-size-md" style="--tag-color:#10b981">东京游记</span>
            <span class="cloud-tag t-size-lg" style="--tag-color:#f59e0b">UI设计</span>
            <span class="cloud-tag t-size-sm" style="--tag-color:#ec4899">生活</span>
            <span class="cloud-tag t-size-md" style="--tag-color:#0ea5e9">数字游民</span>
          </div>
        </div>

        <div class="ai-panel glass-panel">
          <div class="ai-header">
            <div class="ai-avatar">AI</div>
            <div class="ai-title-wrap">
              <h3 class="ai-title">Devv 智能助手</h3>
              <span class="ai-status">在线就绪</span>
            </div>
          </div>
          <div class="ai-chat-area">
            <div class="chat-message ai">
              <div class="msg-bubble">您好！我是您的阅读助手，可以帮您总结文章、提取观点。</div>
            </div>
            <div v-for="(msg, i) in aiMessages" :key="i" class="chat-message" :class="msg.role">
              <div class="msg-bubble">{{ msg.content }}</div>
            </div>
            <div class="chat-message ai" v-if="aiLoading">
              <div class="msg-bubble typing">...</div>
            </div>
          </div>
          <div class="ai-input-area">
            <div class="ai-quick-actions">
              <span class="quick-btn" @click="sendQuickAction('请总结以下文章内容：')">💡 总结全文</span>
              <span class="quick-btn" @click="sendQuickAction('提取以下文章的 3-5 个核心观点：')">🔍 核心观点</span>
            </div>
            <div class="ai-input-box">
              <input type="text" v-model="aiQuestion" placeholder="向 AI 提问..." @keyup.enter="sendAiMessage" />
              <div class="send-btn" @click="sendAiMessage"><el-icon><Promotion /></el-icon></div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Star, StarFilled, Collection, FolderChecked, Share, UserFilled, Promotion, Link, Loading } from '@element-plus/icons-vue'
import { getArticles, scrapeArticle, chatWithAI } from '@/api/index.js'
import { isFavorited, toggleFavorite } from '@/store/favorites.js'
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'

const route = useRoute()
const liked = ref(false)
const followed = ref(false)
const aiQuestion = ref('')
const aiMessages = ref([])
const aiLoading = ref(false)
const isApiData = ref(false)
const scrapedContent = ref('')

const article = reactive({
  id: route.params.id, title: 'Loading...',
  author: { name: '...' },
  tags: [], views: 0, likes: 0, createdAt: '', content: '',
})

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

onMounted(async () => {
  try {
    const result = await getArticles({ limit: 1000 })
    const articlesList = result.items || result
    isApiData.value = result.isApi || false
    const found = articlesList.find(a => String(a.id) === String(route.params.id))
    if (found) {
      Object.assign(article, found)
      import('@/api/index.js').then(({ addHistory }) => {
        addHistory({ module_name: 'articles', item_id: String(article.id), title: article.title, cover: article.cover || article.thumbnail || '' })
      })
      if (article.url && !article.content) {
        const res = await scrapeArticle(article.url)
        if (res.content && !res.content.includes('无法精准提取正文')) {
          scrapedContent.value = res.content
        } else {
          scrapedContent.value = 'iframe'
        }
      }
    }
  } catch (e) { console.error(e) }
})

const isHtmlContent = computed(() => /<[a-z][\s\S]*>/i.test(article.content))
const proxiedContent = computed(() => {
  if (!article.content) return ''
  return article.content.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, (match, src) => {
    if (src.startsWith('data:') || src.startsWith('/') || src.includes('localhost')) return match
    return match.replace(src, `${API_BASE}/img?url=${encodeURIComponent(src)}`)
  })
})

const collected = computed(() => isFavorited('article', article.id))
const handleCollect = () => {
  toggleFavorite('article', article.id)
  ElMessage.success(collected.value ? '已收藏' : '已取消收藏')
}
const likeCount = computed(() => article.likes + (liked.value ? 1 : 0))

function formatNum(num) { return num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num }
function sharePost() { navigator.clipboard.writeText(window.location.href); ElMessage.success('链接已复制') }
function goToOriginal(url) { window.open(url, '_blank') }

async function sendQuickAction(instruction) {
  if (aiLoading.value) return
  const ctx = scrapedContent.value && scrapedContent.value !== 'iframe' ? scrapedContent.value : article.content
  aiMessages.value.push({ role: 'user', content: instruction })
  await processAiRequest(`${instruction}\n\n${ctx.slice(0, 3000)}`)
}
async function sendAiMessage() {
  if (!aiQuestion.value.trim() || aiLoading.value) return
  const text = aiQuestion.value; aiQuestion.value = ''
  const ctx = scrapedContent.value && scrapedContent.value !== 'iframe' ? scrapedContent.value : article.content
  aiMessages.value.push({ role: 'user', content: text })
  await processAiRequest(`${text}\n\n(参考：${ctx.slice(0, 2000)})`)
}
async function processAiRequest(prompt) {
  aiLoading.value = true
  try {
    const chatHistory = aiMessages.value.map(m => ({ role: m.role, content: m.content }))
    chatHistory[chatHistory.length - 1].content = prompt
    const reply = await chatWithAI(chatHistory, '你是专业阅读助手，请根据文章上下文回答。')
    if (reply) { aiMessages.value.push({ role: 'assistant', content: reply }) }
    else { ElMessage.error('AI 响应失败') }
  } catch (e) { ElMessage.error('AI 请求出错') } finally { aiLoading.value = false }
}
</script>

<style scoped>
.post-detail-page {
  height: calc(100vh - 56px);
  padding: 16px 20px;
  overflow: hidden;
}

.three-column-layout {
  display: flex;
  gap: 20px;
  max-width: 1600px;
  margin: 0 auto;
  height: 100%;
}

/* Glass Panel */
.glass-panel {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
}

/* ===== 左侧边栏 260px ===== */
.left-sidebar {
  width: 240px; flex-shrink: 0;
  padding: 20px 18px;
  display: flex; flex-direction: column;
  gap: 16px; overflow-y: auto;
  height: 100%;
}
.left-sidebar::-webkit-scrollbar { width: 0; }

.author-card { text-align: center; }
.author-avatar {
  border: 3px solid #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  margin-bottom: 8px;
}
.author-name {
  font-size: 18px; font-weight: 700; color: #333; margin: 0 0 6px;
}
.author-stats {
  display: flex; justify-content: space-around; margin: 14px 0;
}
.stat-item { text-align: center; }
.stat-val { font-size: 16px; font-weight: 700; color: #252933; }
.stat-label { font-size: 11px; color: #999; display: block; }
.follow-btn { width: 100%; }

.action-list {
  display: flex; justify-content: center; gap: 8px;
}
.action-item {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 10px; border-radius: 12px;
  cursor: pointer; transition: all 0.2s;
  background: rgba(255,255,255,0.4); flex: 1;
}
.action-item:hover { background: rgba(255,255,255,0.8); }
.action-item.active { background: rgba(252,60,68,0.1); color: #fc3c44; }
.icon-wrap {
  width: 34px; height: 34px; border-radius: 10px;
  background: #fff; display: flex; align-items: center; justify-content: center;
  color: #666; box-shadow: 0 2px 6px rgba(0,0,0,0.04);
}
.action-label { font-size: 12px; font-weight: 500; color: #666; }
.action-item.active .action-label { color: #fc3c44; }

.side-title {
  font-size: 13px; font-weight: 700; color: #555;
  margin: 0 0 10px; display: flex; align-items: center; gap: 6px;
}

.toc-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.toc-item {
  font-size: 13px; color: #888; display: flex; align-items: center; gap: 8px;
  cursor: pointer; transition: color 0.2s; padding: 2px 0;
}
.toc-item:hover, .toc-item.active { color: #fc3c44; font-weight: 600; }
.toc-dot {
  width: 5px; height: 5px; border-radius: 50%; background: #ddd; flex-shrink: 0;
}
.toc-item.active .toc-dot { background: #fc3c44; box-shadow: 0 0 6px rgba(252,60,68,0.5); }

/* ===== 中间文章区 flex:1 ===== */
.main-content {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column;
  padding: 0; height: 100%; overflow: hidden;
}

.post-header {
  padding: 24px 32px 16px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  flex-shrink: 0;
}
.api-badge {
  display: inline-block; font-size: 12px; font-weight: 600; color: #fc3c44;
  background: rgba(252,60,68,0.08); padding: 3px 10px; border-radius: 10px; margin-bottom: 10px;
}
.post-title {
  font-size: 26px; font-weight: 800; color: #111; line-height: 1.4;
  margin: 0 0 10px;
}
.post-meta {
  font-size: 13px; color: #999; display: flex; gap: 8px; margin-bottom: 10px;
}
.tag-glass {
  background: rgba(255,255,255,0.5) !important; border-color: rgba(0,0,0,0.08) !important;
  color: #555 !important; border-radius: 6px; margin-right: 6px; font-size: 11px;
}

/* 文章正文 - 固定高度可滚动 */
.post-body {
  flex: 1; overflow-y: auto;
  padding: 24px 32px 40px;
}
.post-body::-webkit-scrollbar { width: 6px; }
.post-body::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }

.original-link-bar {
  display: flex; padding-bottom: 16px;
  margin-bottom: 16px; border-bottom: 1px dashed rgba(0,0,0,0.08);
}

.article-content { line-height: 1.85; font-size: 16px; color: #333; }

.scraped-html :deep(p) { margin-bottom: 18px; line-height: 1.85; }
.scraped-html :deep(img) {
  max-width: 100%; height: auto; border-radius: 12px;
  margin: 16px 0; box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}
.scraped-html :deep(h1), .scraped-html :deep(h2), .scraped-html :deep(h3) { margin: 28px 0 14px; color: #222; }

.loading-card {
  text-align: center; padding: 60px 20px;
  background: rgba(255,255,255,0.3); border-radius: 14px;
  border: 1px dashed rgba(0,0,0,0.08); color: #888;
}
.article-iframe {
  width: 100%; height: 100%; min-height: 600px;
  border: none; border-radius: 12px;
}

/* ===== 右侧边栏 300px ===== */
.right-sidebar {
  width: 300px; flex-shrink: 0;
  display: flex; flex-direction: column;
  gap: 14px; height: 100%;
}

.tag-cloud-widget { padding: 18px 20px; flex-shrink: 0; }
.tags-container { display: flex; flex-wrap: wrap; gap: 8px; }
.cloud-tag {
  background: rgba(255,255,255,0.7); padding: 5px 12px; border-radius: 16px;
  font-weight: 600; color: var(--tag-color); border: 1px solid rgba(0,0,0,0.04);
  font-size: 12px; cursor: pointer; transition: all 0.2s;
}
.cloud-tag:hover { transform: translateY(-2px); background: #fff; }
.t-size-lg { font-size: 14px; padding: 6px 14px; }
.t-size-md { font-size: 12px; }
.t-size-sm { font-size: 11px; padding: 4px 10px; }

.ai-panel {
  flex: 1; display: flex; flex-direction: column;
  overflow: hidden;
}
.ai-header {
  padding: 16px 20px; display: flex; align-items: center; gap: 10px;
  background: rgba(255,255,255,0.3); border-bottom: 1px solid rgba(0,0,0,0.04);
  flex-shrink: 0;
}
.ai-avatar {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 15px; flex-shrink: 0;
}
.ai-title { margin: 0; font-size: 14px; font-weight: 700; color: #222; }
.ai-status { font-size: 11px; color: #10b981; }

.ai-chat-area {
  flex: 1; overflow-y: auto; padding: 14px 18px;
  display: flex; flex-direction: column; gap: 10px;
}
.ai-chat-area::-webkit-scrollbar { width: 0; }

.chat-message { display: flex; }
.chat-message.ai { justify-content: flex-start; }
.chat-message.user { justify-content: flex-end; }
.msg-bubble {
  max-width: 85%; padding: 10px 14px; font-size: 13px; line-height: 1.5; border-radius: 14px;
}
.ai .msg-bubble { background: rgba(255,255,255,0.8); color: #333; border-top-left-radius: 4px; }
.user .msg-bubble { background: linear-gradient(135deg,#4facfe,#00f2fe); color: #fff; border-top-right-radius: 4px; }
.typing { letter-spacing: 2px; }

.ai-input-area {
  padding: 12px 16px 16px; background: rgba(255,255,255,0.3);
  border-top: 1px solid rgba(0,0,0,0.04); flex-shrink: 0;
}
.ai-quick-actions { display: flex; gap: 6px; margin-bottom: 10px; }
.quick-btn {
  white-space: nowrap; padding: 5px 10px; background: rgba(255,255,255,0.6);
  border-radius: 14px; font-size: 11px; color: #666; cursor: pointer;
}
.quick-btn:hover { background: #fff; color: #00f2fe; }
.ai-input-box {
  display: flex; align-items: center; background: rgba(255,255,255,0.8);
  border-radius: 18px; padding: 2px 2px 2px 14px; border: 1px solid rgba(0,0,0,0.04);
}
.ai-input-box input {
  flex: 1; border: none; background: transparent; outline: none; font-size: 13px;
}
.send-btn {
  width: 30px; height: 30px; border-radius: 15px;
  background: #4facfe; color: #fff; display: flex; align-items: center; justify-content: center;
  cursor: pointer;
}
.send-btn:hover { background: #3d9be0; }

/* ===== 响应式 ===== */
@media (max-width: 1300px) {
  .right-sidebar { display: none; }
}
@media (max-width: 900px) {
  .left-sidebar { display: none; }
  .post-header { padding: 20px 20px 14px; }
  .post-body { padding: 16px 20px 32px; }
  .post-detail-page { padding: 8px; }
}
</style>
