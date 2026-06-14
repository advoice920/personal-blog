<template>
  <el-container class="app-container">
    <Sidebar v-if="!isAuthPage" />
    <Navbar v-if="!isAuthPage" />
    <el-main class="app-main" :class="{ 'auth-main': isAuthPage }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>
    <GlobalPlayerBar />
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '@/components/layout/Sidebar.vue'
import Navbar from '@/components/layout/Navbar.vue'
import GlobalPlayerBar from '@/components/player/GlobalPlayerBar.vue'

const route = useRoute()
const isAuthPage = computed(() => ['Login', 'Register', 'ForgotPassword'].includes(route.name))
</script>

<style>
html, body, #app { 
  height: 100%; margin: 0; padding: 0;
  /* Add background image to body */
  background-image: url('/bg-glass.jpg');
  background-size: cover;
  background-attachment: fixed;
  background-position: center;
}
.app-container { min-height: 100vh; display: flex; flex-direction: column; }
.app-main { 
  margin-top: 56px; 
  margin-left: 200px; 
  padding: 0; 
  flex: 1; 
  /* Heavy blur on the main container to soften the background image noise */
  background: rgba(255, 255, 255, 0.2); 
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  transition: all 0.3s ease;
}
.app-main.auth-main {
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.el-card { border: 1px solid rgba(255, 255, 255, 0.6); background: rgba(255, 255, 255, 0.65); }

/* Global overrides for cards to make them glass-like but highly readable */
.article-card, .food-card, .photo-board, .recipe-body, .movie-card, .music-card, .reading-card, .sports-card, .travel-card, .fashion-card, .album-card {
  background: rgba(255, 255, 255, 0.65) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05) !important;
}
</style>
