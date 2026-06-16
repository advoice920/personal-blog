<template>
  <div class="home-page">
    <main class="main-content">
      <template v-if="searchQuery">
        <div class="search-results-board">
          <h2>搜索结果：{{ searchQuery }}</h2>
          <div v-if="isSearching">搜索中...</div>
          <div v-else-if="searchResults.length === 0">未找到相关内容</div>
          <div v-else class="search-feed">
            <div v-for="item in searchResults" :key="item.id + item.type" class="search-card" @click="goToDetail(item)">
              <div class="search-type">[{{ item.type }}]</div>
              <h3 class="search-title">{{ item.title }}</h3>
            </div>
          </div>
        </div>
      </template>
      <template v-else-if="activeCat === 'music'">
        <MusicBoard />
      </template>
      <template v-else-if="activeCat === 'movie'">
        <MovieBoard />
      </template>
      <template v-else-if="activeCat === 'photo'">
        <PhotoBoard />
      </template>
      <template v-else-if="activeCat === 'food'">
        <FoodBoard />
      </template>
      <template v-else-if="activeCat === 'travel'">
        <TravelBoard />
      </template>
      <template v-else-if="activeCat === 'reading'">
        <ReadingBoard />
      </template>
      <template v-else-if="activeCat === 'fashion'">
        <FashionBoard />
      </template>
      <template v-else-if="activeCat === 'sports'">
        <SportsBoard />
      </template>
      <template v-else>
        <div v-if="isApiData && isLoading" class="api-loading-bar">
          <el-icon class="is-loading" :size="20"><Loading /></el-icon>
          <span>正在从天行数据获取最新资讯...</span>
        </div>
        <div v-if="isApiData && !isLoading" class="api-success-bar">
          <el-icon><Check /></el-icon>
          <span>正确从天行api返回数据</span>
        </div>
        <div class="feed-filter-bar">
          <span
            class="filter-tab"
            :class="{ active: feedFilter === 'all' }"
            @click="feedFilter = 'all'"
          >全部文章</span>
          <span
            class="filter-tab"
            :class="{ active: feedFilter === 'mine' }"
            @click="feedFilter = 'mine'"
          >📝 我的文章</span>
          <span class="filter-count">{{ displayArticles.length }} 篇</span>
        </div>
        <div class="article-feed">
          <ArticleCard v-for="article in displayArticles" :key="article.id" :article="article" />
        </div>

        <div class="pagination-wrap">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="totalArticles"
            layout="prev, pager, next"
            background
          />
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loading, Check } from '@element-plus/icons-vue'
import ArticleCard from './ArticleCard.vue'
import MusicBoard from './components/MusicBoard.vue'
import MovieBoard from './components/MovieBoard.vue'
import PhotoBoard from './components/PhotoBoard.vue'
import FoodBoard from './components/FoodBoard.vue'
import TravelBoard from './components/TravelBoard.vue'
import ReadingBoard from './components/ReadingBoard.vue'
import FashionBoard from './components/FashionBoard.vue'
import SportsBoard from './components/SportsBoard.vue'
import { getArticles, searchGlobal } from '@/api/index.js'

const route = useRoute()
const router = useRouter()

const activeCat = ref(route.query.cat || 'article')

watch(() => route.query.cat, (newCat) => {
  activeCat.value = newCat || 'article'
})

const currentPage = ref(1)
const pageSize = ref(25)
const totalArticles = ref(0)

const searchQuery = computed(() => route.query.q || '')
const searchResults = ref([])
const isSearching = ref(false)

const loadSearch = async () => {
  if (searchQuery.value) {
    isSearching.value = true
    try {
      searchResults.value = await searchGlobal(searchQuery.value)
    } finally {
      isSearching.value = false
    }
  }
}

const articlesList = ref([])
const isApiData = ref(false)
const isLoading = ref(false)

const loadArticles = async () => {
  isLoading.value = true
  try {
    const result = await getArticles({ page: currentPage.value, limit: pageSize.value })
    articlesList.value = result.items || result
    totalArticles.value = result.total || (result.items ? result.items.length : result.length)
    isApiData.value = result.isApi || false
  } finally {
    isLoading.value = false
  }
}

watch(currentPage, () => {
  loadArticles()
})

watch(() => route.query.q, () => {
  loadSearch()
})

onMounted(async () => {
  loadArticles()
  if (searchQuery.value) {
    loadSearch()
  }
})

const goToDetail = (item) => {
  console.log('Navigating to', item.type, item.id)
}

const filteredArticles = computed(() => {
  if (activeCat.value === 'article') return articlesList.value
  return articlesList.value.filter(a => a.category === activeCat.value)
})

const feedFilter = ref('all')
const displayArticles = computed(() => {
  if (feedFilter.value === 'mine') {
    // My articles: no source field (or source is null/empty) = manually created
    return filteredArticles.value.filter(a => !a.source && !a.link)
  }
  return filteredArticles.value
})

</script>

<style scoped>
.home-page {
  max-width: none;
  margin: 0;
  display: flex;
  gap: 24px;
  padding: 24px;
  align-items: flex-start;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.api-loading-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  margin-bottom: 16px;
  color: #fc3c44;
  font-weight: 600;
  font-size: 14px;
}

.api-success-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  background: rgba(235, 253, 240, 0.85);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(167, 243, 208, 0.6);
  border-radius: 8px;
  margin-bottom: 16px;
  color: #10b981;
  font-weight: 600;
  font-size: 14px;
}

.feed-filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 0 4px;
}
.filter-tab {
  font-size: 14px;
  color: #888;
  cursor: pointer;
  padding: 6px 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  font-weight: 500;
}
.filter-tab:hover { color: #333; }
.filter-tab.active {
  color: #fc3c44;
  border-bottom-color: #fc3c44;
  font-weight: 700;
}
.filter-count {
  margin-left: auto;
  font-size: 12px;
  color: #aaa;
}

.article-feed {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

.search-results-board {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.search-results-board h2 {
  margin-top: 0;
  margin-bottom: 24px;
}

.search-feed {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-card {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  gap: 12px;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.2s;
}

.search-card:hover {
  transform: translateY(-2px);
}

.search-type {
  color: #fc3c44;
  font-weight: 600;
  font-size: 14px;
}

.search-title {
  margin: 0;
  font-size: 16px;
  color: #333;
}

@media (max-width: 1100px) {
  .home-page { padding: 12px; gap: 12px; }
}
</style>
