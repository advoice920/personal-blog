<template>
  <div class="favorites-page">
    <div class="fav-header-area">
      <h1 class="fav-title">My Saved Inspirations 🗂️</h1>
      <p class="fav-subtitle">A collection of your favorite moments, routines, and aesthetics.</p>
    </div>

    <div class="vibe-tags-container">
      <div class="tags-scroll">
        <button 
          v-for="cat in categories" 
          :key="cat.id"
          class="vibe-tag"
          :class="{ active: activeCat === cat.id }"
          @click="activeCat = cat.id"
        >
          {{ cat.icon }} {{ cat.name }}
        </button>
      </div>
    </div>

    <main class="main-content">
      <div class="board-container">
        <template v-if="activeCat === 'article'">
          <FavArticleBoard :items="favArticleData" />
        </template>
        <template v-else-if="activeCat === 'food'">
          <FoodBoard :items="favFoodData" />
        </template>
        <template v-else-if="activeCat === 'travel'">
          <TravelBoard :items="favTravelData" />
        </template>
        <template v-else-if="activeCat === 'photo'">
          <PhotoBoard :items="favPhotoData" />
        </template>
        <template v-else-if="activeCat === 'reading'">
          <ReadingBoard :items="favReadingData" />
        </template>
        <template v-else-if="activeCat === 'music'">
          <FavMusicBoard :items="favMusicData" />
        </template>
        <template v-else-if="activeCat === 'movie'">
          <FavMovieBoard :items="favMovieData" />
        </template>
        <template v-else-if="activeCat === 'sports'">
          <SportsBoard :items="favSportsData" />
        </template>
        <template v-else-if="activeCat === 'fashion'">
          <FashionBoard :items="favFashionData" />
        </template>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

import FoodBoard from '@/views/Home/components/FoodBoard.vue'
import TravelBoard from '@/views/Home/components/TravelBoard.vue'
import ReadingBoard from '@/views/Home/components/ReadingBoard.vue'
import FashionBoard from '@/views/Home/components/FashionBoard.vue'
import SportsBoard from '@/views/Home/components/SportsBoard.vue'
import PhotoBoard from '@/views/Home/components/PhotoBoard.vue'
import FavMusicBoard from './components/FavMusicBoard.vue'
import FavMovieBoard from './components/FavMovieBoard.vue'
import FavArticleBoard from './components/FavArticleBoard.vue'

import {
  getFoodData, getTravelData, getReadingData, getFashionData, 
  getSportsData, getPhotoData, getArticles, getMusicData, getMovieData
} from '@/api/index.js'

import { isFavorited } from '@/store/favorites.js'

const activeCat = ref('sports') // Default to sports to show off the new style, or 'article'

const categories = [
  { id: 'article', name: '文章', icon: '📄' },
  { id: 'sports', name: '运动', icon: '🚴‍♂️' },
  { id: 'fashion', name: '穿搭', icon: '👗' },
  { id: 'travel', name: '旅行', icon: '✈️' },
  { id: 'food', name: '美食', icon: '🥘' },
  { id: 'photo', name: '摄影', icon: '📷' },
  { id: 'reading', name: '读书', icon: '📚' },
  { id: 'music', name: '音乐', icon: '🎵' },
  { id: 'movie', name: '电影', icon: '🎬' }
]

const rawData = ref({
  food: [], travel: [], reading: [], fashion: [], sports: [], 
  photo: [], article: [], music: [], movie: []
})

onMounted(async () => {
  const [food, travel, reading, fashion, sports, photo, articleRes, music, movie] = await Promise.all([
    getFoodData(), getTravelData(), getReadingData(), getFashionData(),
    getSportsData(), getPhotoData(), getArticles({ limit: 1000 }), getMusicData(), getMovieData()
  ])
  const article = articleRes.items || articleRes;
  rawData.value = { food, travel, reading, fashion, sports, photo, article, music, movie }
})

const favFoodData = computed(() => rawData.value.food.filter(item => isFavorited('food', item.id)))
const favTravelData = computed(() => rawData.value.travel.filter(item => isFavorited('travel', item.id)))
const favReadingData = computed(() => rawData.value.reading.filter(item => isFavorited('reading', item.id)))
const favFashionData = computed(() => rawData.value.fashion.filter(item => isFavorited('fashion', item.id)))
const favSportsData = computed(() => rawData.value.sports.filter(item => isFavorited('sports', item.id)))
const favPhotoData = computed(() => rawData.value.photo.filter(item => isFavorited('photo', item.id)))
const favArticleData = computed(() => rawData.value.article.filter(item => isFavorited('article', item.id)))
const favMusicData = computed(() => rawData.value.music.filter(item => isFavorited('music', item.id)))
const favMovieData = computed(() => rawData.value.movie.filter(item => isFavorited('movie', item.id)))
</script>

<style scoped>
.favorites-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 24px;
}

.fav-header-area {
  text-align: center;
  margin-bottom: 40px;
}
.fav-title {
  font-size: 32px;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0 0 12px 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', sans-serif;
}
.fav-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

/* --- Vibe Tags Style for Category Selection --- */
.vibe-tags-container {
  margin-bottom: 48px;
  display: flex;
  justify-content: center;
}
.tags-scroll {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  background: #fff;
  padding: 12px 24px;
  border-radius: 40px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
}
.vibe-tag {
  background: transparent;
  border: none;
  padding: 10px 20px;
  border-radius: 24px;
  font-size: 15px;
  color: #555;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}
.vibe-tag:hover {
  background: #f4f5f7;
  transform: translateY(-2px);
}
.vibe-tag.active {
  background: #111;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.main-content { 
  min-height: 60vh;
}

.board-container {
  /* Dynamic container for boards */
}

@media (max-width: 768px) {
  .favorites-page { padding: 24px 16px; }
  .tags-scroll { padding: 12px; border-radius: 24px; }
  .vibe-tag { padding: 8px 16px; font-size: 14px; }
}
</style>
