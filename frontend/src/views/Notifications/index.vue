<template>
  <div class="vibe-page-container">
    <div class="vibe-header-area">
      <h1 class="vibe-title">Updates & Whispers 🔔</h1>
      <p class="vibe-subtitle">Catch up on the latest interactions and messages.</p>
    </div>

    <main class="main-content">
      <div class="vibe-card">
        <el-empty description="暂无通知" />
      </div>
    </main>
  </div>
</template>

<script setup>
</script>

<style scoped>
.vibe-page-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 24px;
}
.vibe-header-area {
  text-align: center;
  margin-bottom: 40px;
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
</style>
