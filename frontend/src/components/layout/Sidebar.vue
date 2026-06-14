<template>
  <aside class="sidebar">
    <!-- Logo -->
    <router-link to="/" class="logo">
      <span class="logo-icon">L</span>
      <span class="logo-text">LiveBlog</span>
    </router-link>

    <!-- 导航菜单 -->
    <nav class="menu-group">
      <router-link to="/" class="menu-item" :class="{ active: route.path === '/' }">
        <el-icon :size="22"><HomeFilled /></el-icon>
        <span>首页</span>
      </router-link>
      <router-link to="/notifications" class="menu-item" :class="{ active: route.path.startsWith('/notifications') }">
        <el-icon :size="22"><Bell /></el-icon>
        <span>通知</span>
      </router-link>
      <router-link to="/editor" class="menu-item" :class="{ active: route.path.startsWith('/editor') }">
        <el-icon :size="22"><EditPen /></el-icon>
        <span>创作</span>
      </router-link>
      <router-link to="/history" class="menu-item" :class="{ active: route.path.startsWith('/history') }">
        <el-icon :size="22"><Clock /></el-icon>
        <span>历史</span>
      </router-link>
      <router-link to="/favorites" class="menu-item" :class="{ active: route.path.startsWith('/favorites') }">
        <el-icon :size="22"><StarFilled /></el-icon>
        <span>收藏</span>
      </router-link>
      <router-link to="/following" class="menu-item" :class="{ active: route.path.startsWith('/following') }">
        <el-icon :size="22"><UserFilled /></el-icon>
        <span>关注</span>
      </router-link>
    </nav>

    <!-- 热门话题 -->
    <div class="sidebar-widget">
      <h3 class="widget-title">
        <el-icon><TrendCharts /></el-icon> 热门话题
      </h3>
      <div class="trending-tags">
        <span class="tag"># 前端进阶</span>
        <span class="tag"># 独立开发者</span>
        <span class="tag"># 周末看什么剧</span>
        <span class="tag"># AIGC探索</span>
      </div>
    </div>

    <!-- 每日灵感 -->
    <div class="sidebar-widget inspiration-card">
      <h3 class="widget-title">
        <el-icon><Opportunity /></el-icon> 每日灵感
      </h3>
      <p class="quote">"生活不是等待暴风雨过去，而是学会在雨中跳舞。"</p>
      <p class="author">— Vivian Greene</p>
    </div>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { HomeFilled, Bell, EditPen, Clock, StarFilled, UserFilled, TrendCharts, Opportunity } from '@element-plus/icons-vue'

const route = useRoute()
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 200px;
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.4);
  z-index: 1000;
  overflow-y: auto;
}

/* Logo */
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  padding: 16px 16px 20px;
  border-bottom: 1px solid #f5f5f5;
  flex-shrink: 0;
}
.logo-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #fc3c44, #ff2d55);
  color: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 18px;
}
.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #111;
}

/* 导航菜单 */
.menu-group {
  padding: 8px;
  flex: 1;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 15px;
  color: #555;
  text-decoration: none;
  transition: all 0.15s;
}
.menu-item:hover {
  background: #fdf2f3;
  color: #fc3c44;
}
.menu-item.active {
  background: #fc3c44;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(252, 60, 68, 0.3);
}

/* Sidebar Widgets */
.sidebar-widget {
  margin: 0 16px 20px 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 12px;
}

.widget-title {
  font-size: 14px;
  color: #333;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.trending-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  font-size: 12px;
  color: #fc3c44;
  background: rgba(253, 242, 243, 0.6);
  padding: 4px 10px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tag:hover {
  background: #fc3c44;
  color: #fff;
}

.inspiration-card {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.quote {
  font-size: 13px;
  color: #555;
  font-style: italic;
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.author {
  font-size: 12px;
  color: #999;
  margin: 0;
  text-align: right;
}
</style>
