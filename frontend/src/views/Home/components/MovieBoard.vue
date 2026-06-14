<template>
  <div class="review-board">
    <!-- 精选影评 Hero -->
    <div class="featured-review" v-if="featuredReview">
      <div class="featured-bg" :style="{ backgroundImage: `url(${featuredReview.cover})` }"></div>
      <div class="featured-overlay"></div>

      <!-- Navigation arrows -->
      <div class="featured-nav featured-nav-prev" @click.stop="prevMovie">
        <span>‹</span>
      </div>
      <div class="featured-nav featured-nav-next" @click.stop="nextMovie">
        <span>›</span>
      </div>

      <div class="featured-content">
        <div class="featured-poster clickable" @click="goToComments(featuredReview)">
          <img :src="featuredReview.cover" :alt="featuredReview.title" />
          <div class="poster-hint">点击查看影评</div>
        </div>
        <div class="featured-info">
          <div class="featured-meta-top">
            <span class="featured-badge">精选影评</span>
            <span class="featured-cat" v-for="g in (featuredReview.genres || [])" :key="g">{{ g }}</span>
            <span class="featured-year" v-if="featuredReview.year">{{ featuredReview.year }}</span>
            <span class="featured-runtime" v-if="featuredReview.runtime">{{ featuredReview.runtime }}</span>
            <span class="featured-index">{{ currentIndex + 1 }} / {{ filteredMovies.length }}</span>
          </div>
          <h1 class="featured-title clickable" @click="goToComments(featuredReview)">{{ featuredReview.title }}</h1>
          <div class="featured-original" v-if="featuredReview.originalTitle && featuredReview.originalTitle !== featuredReview.title">{{ featuredReview.originalTitle }}</div>
          <div class="featured-rating">
            <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.round(featuredReview.rating || 0) }">★</span>
            <span class="rating-score">{{ featuredReview.rating || '暂无' }}</span>
            <span class="rating-votes" v-if="featuredReview.voteCount">（{{ (featuredReview.voteCount / 1000).toFixed(1) }}k 人评分）</span>
          </div>
          <p class="featured-synopsis" v-if="getSynopsis(featuredReview)">{{ getSynopsis(featuredReview) }}</p>
          <div class="featured-credits">
            <span class="credit-label">🎬 导演：</span>
            <span class="credit-value">{{ featuredReview.director || '未知' }}</span>
            <span class="credit-divider">|</span>
            <span class="credit-label">👥 主演：</span>
            <span class="credit-value">{{ (featuredReview.actors || []).map(a => a.name).join(' / ') || '未知' }}</span>
          </div>
          <p class="featured-excerpt">💬 "{{ getReviewText(featuredReview) }}"</p>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="section-container">
      <div class="filter-bar">
        <div class="filter-group main-filters">
          <span class="filter-item" :class="{ active: activeMainFilter === '最新影评' }" @click="activeMainFilter = '最新影评'">最新影评</span>
          <span class="filter-item" :class="{ active: activeMainFilter === '高分推荐' }" @click="activeMainFilter = '高分推荐'">高分推荐</span>
          <span class="filter-item" :class="{ active: activeMainFilter === '热门讨论' }" @click="activeMainFilter = '热门讨论'">热门讨论</span>
        </div>
        <div class="filter-group type-filters">
          <span class="filter-label highlight">类型</span>
          <span v-for="cat in movieCategories" :key="cat" class="filter-item" :class="{ active: activeCategory === cat }" @click="activeCategory = cat">{{ cat }}</span>
        </div>
      </div>

      <div class="review-grid">
        <div class="review-card-wrapper" v-for="movie in filteredMovies" :key="movie.id">
          <div class="review-card" :class="{ 'is-selected': selectedMovieId === movie.id }" @click="selectMovie(movie)">
            <div class="review-card-poster">
              <img :src="movie.cover" :alt="movie.title" />
              <span class="review-card-rating">⭐ {{ movie.rating }}</span>
            </div>
            <div class="review-card-body">
              <h3 class="review-card-title">{{ movie.title }}</h3>
              <div class="review-card-meta">
                <span v-if="movie.year">{{ movie.year }}</span>
                <span v-if="movie.year">·</span>
                <span v-for="g in (movie.genres || []).slice(0,2)" :key="g">{{ g }}</span>
                <span v-if="(movie.genres || []).length > 0">·</span>
                <span v-if="movie.runtime">{{ movie.runtime }}</span>
              </div>
              <p class="review-card-synopsis" v-if="getSynopsis(movie)">{{ getSynopsis(movie) }}</p>
              <div class="review-card-credits">
                <span>🎬 {{ movie.director || '未知' }}</span>
                <span class="credit-sep">|</span>
                <span>👥 {{ (movie.actors || []).slice(0, 3).map(a => a.name).join(' / ') || '未知' }}</span>
              </div>
              <p class="review-card-comment">💬 "{{ getReviewText(movie) }}"</p>
            </div>
            <div class="card-actions">
              <div class="comment-btn" :class="{ 'has-comments': (commentCounts[movie.id] || 0) > 0 }" @click.stop="toggleComments(movie)">
                <el-icon><ChatDotRound /></el-icon>
                <span class="comment-count" v-if="(commentCounts[movie.id] || 0) > 0">{{ commentCounts[movie.id] }}</span>
              </div>
              <div class="fav-btn" :class="{ 'is-active': isFavorited('movie', movie.id) }" @click.stop="toggleFavorite('movie', movie.id)">
                <el-icon><StarFilled /></el-icon>
              </div>
            </div>
          </div>

          <!-- Expandable Comment Panel -->
          <transition name="comment-slide">
            <div class="comment-panel" v-if="expandedMovieId === movie.id">
              <div class="comment-panel-header">
                <span class="comment-panel-title">💬 影评讨论</span>
                <span class="comment-panel-tag local" v-if="(commentCounts[movie.id] || 0) > 0">本站 {{ commentCounts[movie.id] }}</span>
                <el-icon class="comment-panel-close" @click="expandedMovieId = null"><Close /></el-icon>
              </div>

              <!-- TMDB Real Reviews (with loading delay indicator) -->
              <div v-if="reviewsLoading[movie.id]" class="comment-loading">
                加载中...
              </div>
              <div class="tmdb-reviews" v-else-if="(movieReviews[movie.id] || []).length > 0">
                <div class="tmdb-review-item" v-for="r in movieReviews[movie.id]" :key="r.id">
                  <div class="tmdb-review-avatar" :style="{ background: avatarColor(r.author) }">
                  {{ (r.author || '?').charAt(0) }}
                </div>
                  <div class="tmdb-review-body">
                    <div class="tmdb-review-header">
                      <span class="tmdb-review-author">{{ r.author }}</span>
                      <span class="tmdb-review-rating" v-if="r.rating">⭐ {{ r.rating }}</span>
                    </div>
                    <p class="tmdb-review-text">{{ r.content }}</p>
                    <div class="tmdb-review-footer">
                      <span class="tmdb-review-time">{{ formatCommentTime(r.created_at) }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="comment-empty" v-else-if="!reviewsLoading[movie.id] && !commentLoading[movie.id]">
                暂无人评论，来发表第一条影评吧
              </div>

              <!-- Local Comments -->
              <div class="section-divider" v-if="(movieReviews[movie.id] || []).length > 0 && (movieComments[movie.id] || []).length > 0">
                <span>本站评论</span>
              </div>
              <div class="comment-list" v-if="commentLoading[movie.id]">
                <div class="comment-loading">加载中...</div>
              </div>
              <div class="comment-list" v-else-if="(movieComments[movie.id] || []).length > 0">
                <div class="comment-item" v-for="c in movieComments[movie.id]" :key="c.id">
                  <div class="comment-avatar">{{ (c.user_email || '匿名').charAt(0).toUpperCase() }}</div>
                  <div class="comment-body">
                    <div class="comment-header">
                      <span class="comment-author">{{ c.user_email || '匿名用户' }}</span>
                      <span class="comment-time">{{ formatCommentTime(c.created_at) }}</span>
                    </div>
                    <p class="comment-text">{{ c.content }}</p>
                    <span class="comment-delete" v-if="canDeleteComment(c)" @click="handleDeleteComment(movie.id, c.id)">删除</span>
                  </div>
                </div>
              </div>
              <div class="comment-empty" v-else>
                <template v-if="(movieReviews[movie.id] || []).length === 0">快来发表第一条评论吧</template>
              </div>

              <!-- Add Comment Input -->
              <div class="comment-input-area">
                <el-input
                  v-model="commentTexts[movie.id]"
                  type="textarea"
                  :rows="2"
                  placeholder="写下你的影评..."
                  maxlength="500"
                  show-word-limit
                  @keydown.enter.ctrl="postComment(movie)"
                />
                <el-button type="primary" size="small" class="comment-submit-btn" :loading="postingComment[movie.id]" @click="postComment(movie)">
                  发布评论
                </el-button>
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <div class="pagination-wrap" v-if="totalItems > 0 && !props.items">
      <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="totalItems" layout="prev, pager, next" background @current-change="handlePageChange" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { StarFilled, ChatDotRound, Close } from '@element-plus/icons-vue'
import { getMovieData } from '@/api/index.js'
import { getComments, addComment, deleteComment, getMovieReviews } from '@/api/index.js'
import { isFavorited, toggleFavorite } from '@/store/favorites.js'
import { ElMessage } from 'element-plus'

const props = defineProps({
  items: { type: Array, default: null }
})

const localData = ref([])
const loading = ref(false)
const movieCategories = ['科幻', '剧情', '动作', '喜剧', '悬疑', '爱情']

const activeCategory = ref('科幻')
const activeMainFilter = ref('最新影评')

const filteredMovies = computed(() => {
  if (props.items) return props.items
  return localData.value
})

const selectedMovieId = ref(null)

const featuredReview = computed(() => {
  const list = filteredMovies.value
  if (list.length === 0) return null
  if (selectedMovieId.value) {
    return list.find(m => m.id === selectedMovieId.value) || list[0]
  }
  return list[0]
})

const selectMovie = (movie) => {
  selectedMovieId.value = movie.id
}

const currentIndex = computed(() => {
  const list = filteredMovies.value
  const idx = list.findIndex(m => m.id === featuredReview.value?.id)
  return idx >= 0 ? idx : 0
})

const prevMovie = () => {
  const list = filteredMovies.value
  if (list.length < 2) return
  const idx = currentIndex.value
  const prev = idx <= 0 ? list.length - 1 : idx - 1
  selectedMovieId.value = list[prev].id
}

const nextMovie = () => {
  const list = filteredMovies.value
  if (list.length < 2) return
  const idx = currentIndex.value
  const next = idx >= list.length - 1 ? 0 : idx + 1
  selectedMovieId.value = list[next].id
}

const goToComments = async (movie) => {
  selectMovie(movie)
  await toggleComments(movie)
  // Scroll to the comment panel
  setTimeout(() => {
    const el = document.querySelector(`.review-card-wrapper:nth-child(${currentIndex.value + 1}) .comment-panel`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, 200)
}

const currentPage = ref(1)
const pageSize = ref(12)
const totalItems = ref(0)

const loadData = async () => {
  if (!props.items) {
    loading.value = true
    try {
      const res = await getMovieData({ page: currentPage.value, limit: pageSize.value, category: activeCategory.value })
      localData.value = res.items || res
      totalItems.value = res.total || (res.items ? res.items.length : res.length) || 0
      selectedMovieId.value = null
    } catch (e) { console.error(e) } finally { loading.value = false }
  }
}

const handlePageChange = (val) => { currentPage.value = val; loadData() }

watch(activeCategory, () => { currentPage.value = 1; selectedMovieId.value = null; loadData() })

onMounted(() => { loadData() })

// --- Comment System ---
const expandedMovieId = ref(null)
const commentTexts = ref({})
const movieComments = ref({})
const commentCounts = ref({})
const commentLoading = ref({})
const postingComment = ref({})
const movieReviews = ref({})        // TMDB real reviews
const reviewsLoading = ref({})      // Loading state for TMDB reviews

const toggleComments = async (movie) => {
  if (expandedMovieId.value === movie.id) {
    expandedMovieId.value = null
    return
  }
  expandedMovieId.value = movie.id
  if (!commentTexts.value[movie.id]) {
    commentTexts.value[movie.id] = ''
  }
  await Promise.all([
    loadComments(movie.id),
    loadMovieReviews(movie.id),
  ])
}

const loadMovieReviews = async (movieId) => {
  reviewsLoading.value[movieId] = true
  try {
    const result = await getMovieReviews(String(movieId), 1)
    movieReviews.value[movieId] = result.items || []
  } catch (e) {
    console.error('Load TMDB reviews error:', e)
    movieReviews.value[movieId] = []
  } finally {
    reviewsLoading.value[movieId] = false
  }
}

const loadComments = async (movieId) => {
  commentLoading.value[movieId] = true
  try {
    const result = await getComments('movie', String(movieId), 1, 50)
    movieComments.value[movieId] = result.items || []
    commentCounts.value[movieId] = result.total || (result.items ? result.items.length : 0)
  } catch (e) {
    console.error('Load comments error:', e)
  } finally {
    commentLoading.value[movieId] = false
  }
}

const postComment = async (movie) => {
  const text = (commentTexts.value[movie.id] || '').trim()
  if (!text) {
    ElMessage.warning('请输入评论内容')
    return
  }
  const token = localStorage.getItem('token') || localStorage.getItem('mockToken')
  if (!token) {
    ElMessage.warning('请先登录后再评论')
    return
  }
  postingComment.value[movie.id] = true
  try {
    const result = await addComment('movie', String(movie.id), text)
    if (result.code === 200 || result.message) {
      commentTexts.value[movie.id] = ''
      ElMessage.success('评论发布成功')
      await loadComments(movie.id)
    } else {
      ElMessage.error(result.msg || '评论发布失败')
    }
  } catch (e) {
    ElMessage.error('评论发布失败')
  } finally {
    postingComment.value[movie.id] = false
  }
}

const canDeleteComment = (comment) => {
  const currentUserId = getCurrentUserId()
  return currentUserId && Number(comment.user_id) === Number(currentUserId)
}

const getCurrentUserId = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('mockToken')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.id
  } catch (e) {
    return null
  }
}

const handleDeleteComment = async (movieId, commentId) => {
  try {
    await deleteComment(commentId)
    ElMessage.success('评论已删除')
    await loadComments(movieId)
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

const avatarColor = (name) => {
  const colors = ['#667eea','#764ba2','#f093fb','#4facfe','#43e97b','#fa709a','#fee140','#30cfd0','#a8c0ff','#c2e9fb']
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

const formatCommentTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return date.toLocaleDateString('zh-CN')
}

const getSynopsis = (movie) => {
  if (movie.synopsis && movie.synopsis !== '暂无简介') return movie.synopsis
  if (movie.desc && movie.desc !== '暂无简介') return movie.desc
  return ''
}

const reviewSnippets = {
  '科幻': ['视觉奇观与哲学思辨的完美结合，探讨了科技与人性的边界。', '宏大的宇宙观设定，让人在震撼之余引发对未来的深思。', '特效惊艳但不喧宾夺主，故事内核才是真正的亮点。'],
  '剧情': ['细腻的情感刻画令人动容，每个角色都栩栩如生。', '节奏把控精准，层层递进的叙事让人欲罢不能。', '平凡的故事里藏着不平凡的力量，后劲十足。'],
  '动作': ['打斗场面行云流水，拳拳到肉的真实感让人热血沸腾。', '节奏紧凑全程无尿点，动作设计与剧情推进相得益彰。', '燃到炸裂！每一场动作戏都经过精心编排。'],
  '喜剧': ['笑点密集但不低俗，幽默背后藏着温暖的人间真情。', '轻松愉快的观影体验，演员的喜剧节奏感一流。', '包袱抖得恰到好处，让人从头笑到尾又不觉得空洞。'],
  '悬疑': ['反转再反转，直到最后一刻才恍然大悟，编剧太会了！', '氛围营造得极好，全程手心冒汗，悬疑感拉满。', '细节铺垫精妙，二刷才发现之前漏掉了多少线索。'],
  '爱情': ['甜而不腻，两个主角的化学反应让人心动不已。', '真实还原了爱情中的甜蜜与苦涩，代入感极强。', '画面唯美配乐动人，一段令人相信爱情的浪漫故事。'],
}
const getReviewText = (movie) => {
  if (movie.review) return movie.review
  const cat = (movie.genres && movie.genres[0]) || '剧情'
  const snippets = reviewSnippets[cat] || reviewSnippets['剧情']
  const idx = (movie.id || 0).toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0) % snippets.length
  return snippets[idx]
}
</script>

<style scoped>
.review-board {
  min-height: 100vh;
  padding: 20px 0 60px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* ===== 精选影评 ===== */
.featured-review {
  position: relative; height: 440px;
  border-radius: 20px; overflow: hidden;
  display: flex; align-items: center;
  margin: 0 24px 30px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.25);
}
.featured-bg {
  position: absolute; inset: 0;
  background-size: cover; background-position: center;
  filter: blur(40px) brightness(0.3);
  transform: scale(1.1);
}
.featured-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.55) 100%);
}
.featured-content {
  position: relative; z-index: 2;
  display: flex; align-items: center; gap: 36px;
  padding: 0 48px; width: 100%;
}
.featured-poster {
  width: 190px; flex-shrink: 0;
  border-radius: 12px; overflow: hidden; position: relative;
  box-shadow: 0 8px 30px rgba(0,0,0,0.5);
  transition: transform 0.3s;
}
.featured-poster.clickable { cursor: pointer; }
.featured-poster.clickable:hover { transform: scale(1.03); }
.featured-poster.clickable:hover .poster-hint { opacity: 1; }
.featured-poster img { width: 100%; display: block; aspect-ratio: 2/3; object-fit: cover; }
.poster-hint {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 10px; text-align: center;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: #fff; font-size: 12px; font-weight: 600;
  opacity: 0; transition: opacity 0.3s;
}
.featured-title.clickable { cursor: pointer; transition: color 0.2s; }
.featured-title.clickable:hover { color: #fc3c44; text-shadow: 0 0 20px rgba(252,60,68,0.3); }

.featured-info { flex: 1; min-width: 0; color: #fff; }
.featured-meta-top {
  display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;
}
.featured-badge {
  font-size: 12px; font-weight: 700;
  background: linear-gradient(135deg, #fc3c44, #ff2d55);
  padding: 4px 12px; border-radius: 10px;
}
.featured-cat {
  font-size: 12px; color: rgba(255,255,255,0.8);
  background: rgba(255,255,255,0.15); padding: 4px 10px; border-radius: 8px;
}
.featured-year, .featured-runtime {
  font-size: 12px; color: rgba(255,255,255,0.5);
}
.featured-title {
  margin: 0 0 4px; font-size: 34px; font-weight: 800;
  line-height: 1.2; text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}
.featured-original {
  font-size: 14px; color: rgba(255,255,255,0.45); margin-bottom: 10px;
}
.featured-rating {
  display: flex; align-items: center; gap: 6px; margin-bottom: 12px;
}
.featured-rating .star {
  font-size: 22px; color: rgba(255,255,255,0.2); transition: color 0.2s;
}
.featured-rating .star.filled { color: #fadb14; }
.rating-score { font-size: 18px; font-weight: 700; color: #fadb14; }
.rating-votes { font-size: 12px; color: rgba(255,255,255,0.4); }

.featured-synopsis {
  margin: 0 0 10px; font-size: 14px; line-height: 1.7;
  color: rgba(255,255,255,0.72);
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.featured-credits {
  display: flex; align-items: center; flex-wrap: wrap; gap: 4px;
  margin-bottom: 10px; font-size: 13px;
}
.credit-label { color: rgba(255,255,255,0.45); }
.credit-value { color: rgba(255,255,255,0.7); }
.credit-divider { color: rgba(255,255,255,0.2); margin: 0 6px; }

.featured-excerpt {
  margin: 0; font-size: 15px; line-height: 1.6;
  color: rgba(255,255,255,0.9); font-style: italic;
}

.featured-index {
  margin-left: auto; font-size: 13px; color: rgba(255,255,255,0.5); font-weight: 500;
}

/* Navigation arrows */
.featured-nav {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 48px; height: 48px; border-radius: 50%;
  background: rgba(255,255,255,0.12); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; z-index: 5; transition: all 0.25s;
}
.featured-nav:hover { background: rgba(255,255,255,0.25); transform: translateY(-50%) scale(1.08); }
.featured-nav span { font-size: 32px; color: #fff; line-height: 1; font-weight: 300; }
.featured-nav-prev { left: 16px; }
.featured-nav-next { right: 16px; }

/* ===== 筛选栏 ===== */
.section-container { padding: 0 24px; }
.filter-bar {
  display: flex; flex-direction: column; gap: 14px;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px; padding: 16px 22px;
}
.filter-group { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.filter-item {
  color: #666; font-size: 14px; font-weight: 500;
  cursor: pointer; padding: 6px 16px; border-radius: 18px;
  transition: all 0.2s; user-select: none;
}
.filter-item:hover { background: rgba(255,255,255,0.6); color: #333; }
.filter-item.active {
  background: linear-gradient(135deg, #fc3c44, #ff2d55);
  color: #fff; box-shadow: 0 2px 8px rgba(252,60,68,0.25);
}
.filter-label { color: #999; font-size: 14px; }
.filter-label.highlight { color: #333; font-weight: 600; }

/* ===== 影评网格 ===== */
.review-grid {
  display: flex; flex-direction: column; gap: 14px;
}

/* ===== 影评卡片 ===== */
.review-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 14px; padding: 16px;
  display: flex; gap: 16px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  position: relative;
}
.review-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); }
.review-card.is-selected {
  border-color: #fc3c44;
  box-shadow: 0 0 0 2px rgba(252,60,68,0.25), 0 8px 24px rgba(0,0,0,0.08);
}

.review-card-poster {
  width: 110px; flex-shrink: 0;
  border-radius: 8px; overflow: hidden; position: relative;
}
.review-card-poster img { width: 100%; display: block; aspect-ratio: 2/3; object-fit: cover; }
.review-card-rating {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: rgba(0,0,0,0.75); color: #fadb14;
  font-size: 12px; font-weight: 700; text-align: center;
  padding: 4px 0;
}

.review-card-body { flex: 1; min-width: 0; }
.review-card-title {
  margin: 0 0 4px; font-size: 17px; font-weight: 600; color: #1a1a1a;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  padding-right: 30px;
}
.review-card-meta {
  font-size: 12px; color: #aaa; margin-bottom: 8px;
  display: flex; gap: 4px; flex-wrap: wrap;
}
.review-card-synopsis {
  margin: 0 0 8px; font-size: 13px; color: #666; line-height: 1.6;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.review-card-credits {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #aaa; margin-bottom: 6px;
}
.credit-sep { color: #ddd; }
.review-card-comment {
  margin: 0; font-size: 12px; color: #999;
  font-style: italic;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.fav-btn {
  background: rgba(255,255,255,0.85); color: #ccc;
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; cursor: pointer; z-index: 2;
  transition: all 0.2s;
}
.review-card:hover .fav-btn { background: #fff; }
.fav-btn:hover { color: #fc3c44; transform: scale(1.1); }
.fav-btn.is-active { color: #fc3c44; }

/* Card action buttons */
.card-actions {
  position: absolute; top: 14px; right: 14px;
  display: flex; gap: 8px; z-index: 3;
}
.comment-btn {
  background: rgba(255,255,255,0.85); color: #999;
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; cursor: pointer;
  transition: all 0.2s; position: relative;
}
.comment-btn.has-comments { color: #409eff; }
.comment-btn .comment-count {
  position: absolute; top: -4px; right: -6px;
  background: #fc3c44; color: #fff;
  font-size: 10px; min-width: 16px; height: 16px;
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
  font-weight: 700; padding: 0 3px;
}
.review-card:hover .comment-btn { background: #fff; }
.comment-btn:hover { color: #409eff; transform: scale(1.1); }

/* Comment Panel */
.comment-panel {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 12px; margin-top: 8px; padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
.comment-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px; padding-bottom: 10px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.comment-panel-title { font-size: 14px; font-weight: 600; color: #333; }
.comment-panel-close { font-size: 18px; color: #999; cursor: pointer; }
.comment-panel-close:hover { color: #333; }

.comment-list { max-height: 280px; overflow-y: auto; }
.comment-item {
  display: flex; gap: 10px; padding: 10px 0;
  border-bottom: 1px solid rgba(0,0,0,0.04);
}
.comment-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; flex-shrink: 0;
}
.comment-body { flex: 1; min-width: 0; }
.comment-header {
  display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
}
.comment-author { font-size: 13px; font-weight: 600; color: #333; }
.comment-time { font-size: 11px; color: #bbb; }
.comment-text {
  margin: 0; font-size: 13px; color: #555; line-height: 1.6;
  word-break: break-word;
}
.comment-delete {
  font-size: 11px; color: #ccc; cursor: pointer; margin-top: 4px; display: inline-block;
}
.comment-delete:hover { color: #fc3c44; }
.comment-empty {
  text-align: center; color: #bbb; font-size: 13px;
  padding: 24px 0;
}
.comment-loading { text-align: center; color: #999; padding: 16px 0; font-size: 13px; }

.comment-input-area {
  display: flex; gap: 10px; align-items: flex-end;
  margin-top: 14px; padding-top: 12px;
  border-top: 1px solid rgba(0,0,0,0.06);
}
.comment-input-area :deep(.el-textarea__inner) {
  border-radius: 10px; font-size: 13px;
  background: rgba(255,255,255,0.7);
}
.comment-submit-btn {
  flex-shrink: 0; border-radius: 10px;
  background: linear-gradient(135deg, #fc3c44, #ff2d55);
  border: none;
}
.comment-submit-btn:hover {
  background: linear-gradient(135deg, #e8353d, #e8284c);
}

/* TMDB Reviews */
.tmdb-reviews {
  max-height: 400px; overflow-y: auto;
}
.tmdb-review-item {
  display: flex; gap: 12px; padding: 14px 0;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.tmdb-review-avatar {
  width: 36px; height: 36px; border-radius: 50%; overflow: hidden;
  flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 15px; font-weight: 700;
}
.tmdb-review-body { flex: 1; min-width: 0; }
.tmdb-review-header {
  display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
}
.tmdb-review-author { font-size: 13px; font-weight: 700; color: #1a1a1a; }
.tmdb-review-rating {
  font-size: 12px; color: #f5a623; font-weight: 600;
  background: rgba(245,166,35,0.1); padding: 1px 8px; border-radius: 10px;
}
.tmdb-badge {
  font-size: 10px; font-weight: 700; color: #fff;
  background: linear-gradient(135deg, #01b4e4, #90cea1);
  padding: 1px 8px; border-radius: 8px; letter-spacing: 0.5px;
}
.tmdb-review-text {
  margin: 0 0 6px; font-size: 13px; color: #444; line-height: 1.7;
  display: -webkit-box; -webkit-line-clamp: 8; -webkit-box-orient: vertical; overflow: hidden;
}
.tmdb-review-footer {
  display: flex; align-items: center; justify-content: space-between;
}
.tmdb-review-time { font-size: 11px; color: #bbb; }
.tmdb-review-link {
  font-size: 11px; color: #409eff; text-decoration: none;
}
.tmdb-review-link:hover { text-decoration: underline; }

.comment-panel-tag {
  font-size: 11px; padding: 2px 10px; border-radius: 10px; margin-left: 8px;
}
.comment-panel-tag.tmdb {
  background: rgba(1,180,228,0.1); color: #01b4e4; font-weight: 600;
}
.comment-panel-tag.local {
  background: rgba(252,60,68,0.08); color: #fc3c44; font-weight: 500;
}

.section-divider {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 0 4px; margin-top: 4px;
}
.section-divider::before, .section-divider::after {
  content: ''; flex: 1; height: 1px; background: rgba(0,0,0,0.06);
}
.section-divider span {
  font-size: 12px; color: #999; font-weight: 500;
}

.loading-dot {
  display: inline-block; width: 8px; height: 8px; border-radius: 50%;
  background: #01b4e4; animation: pulse 1s infinite;
  margin-right: 6px;
}
@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

/* Comment slide transition */
.comment-slide-enter-active { transition: all 0.25s ease; }
.comment-slide-leave-active { transition: all 0.15s ease; }
.comment-slide-enter-from, .comment-slide-leave-to {
  opacity: 0; transform: translateY(-10px); max-height: 0;
}
.comment-slide-enter-to, .comment-slide-leave-from {
  opacity: 1; transform: translateY(0); max-height: 600px;
}

.pagination-wrap { display: flex; justify-content: center; padding: 30px 0; width: 100%; }

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .featured-review { height: auto; margin: 0 12px 24px; }
  .featured-content { flex-direction: column; padding: 30px 20px; gap: 18px; text-align: center; }
  .featured-poster { width: 130px; margin: 0 auto; }
  .featured-title { font-size: 24px; }
  .featured-credits { justify-content: center; }
  .section-container { padding: 0 12px; }
  .review-card { flex-direction: column; }
  .review-card-poster { width: 80px; }
}
@media (max-width: 480px) {
  .featured-content { padding: 20px 14px; }
  .featured-title { font-size: 20px; }
  .filter-bar { padding: 12px 14px; }
}
</style>
