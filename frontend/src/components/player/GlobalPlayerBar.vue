<template>
  <div
    v-if="player.currentSong"
    ref="floatBox"
    class="float-player"
    :class="{ expanded: isExpanded }"
    :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
    @mousedown="onDragStart"
    @touchstart="onDragStart"
  >
    <!-- Collapsed: just the rotating cover -->
    <div class="cover-circle" :class="{ spinning: player.isPlaying }" @click.stop="toggleExpand">
      <img :src="coverUrl" alt="cover" />
      <div class="cover-ring"></div>
    </div>

    <!-- Expanded: mini player card -->
    <transition name="fade-scale">
      <div v-if="isExpanded" class="player-card" @click.stop>
        <!-- Drag handle -->
        <div class="drag-handle" @mousedown="onDragStart" @touchstart="onDragStart">
          <span class="handle-bar"></span>
        </div>

        <!-- Info -->
        <div class="card-info">
          <img :src="coverUrl" class="card-cover" />
          <div class="card-text">
            <p class="card-title">{{ player.currentSong.name || player.currentSong.title }}</p>
            <p class="card-artist">{{ player.currentSong.artist || player.currentSong.creatorName || '' }}</p>
          </div>
        </div>

        <!-- Progress -->
        <div class="card-progress" ref="progressBar" @click="seekTo">
          <div class="progress-bg">
            <div class="progress-cur" :style="{ width: player.progress + '%' }"></div>
          </div>
          <span class="time-text">{{ player.formattedTime }} / {{ player.formattedDuration }}</span>
        </div>

        <!-- Controls -->
        <div class="card-controls">
          <el-icon :size="16" @click="player.playPrev()"><DArrowLeft /></el-icon>
          <div class="play-btn" @click="player.togglePlay()">
            <el-icon :size="20" v-if="player.isPlaying"><VideoPause /></el-icon>
            <el-icon :size="20" v-else><VideoPlay /></el-icon>
          </div>
          <el-icon :size="16" @click="player.playNext()"><DArrowRight /></el-icon>
          <el-icon :size="14" @click="player.setSong(null)" class="close-icon"><Close /></el-icon>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { VideoPlay, VideoPause, DArrowLeft, DArrowRight, Close } from '@element-plus/icons-vue'
import { useAudioPlayer } from '@/store/audioPlayer'

const player = useAudioPlayer()

const isExpanded = ref(false)
const floatBox = ref(null)
const progressBar = ref(null)

const coverUrl = computed(() => {
  return player.currentSong?.coverUrl || player.currentSong?.cover_url || player.currentSong?.cover || ''
})

// --- Drag state ---
const pos = ref({ x: window.innerWidth - 80, y: window.innerHeight - 120 })
let dragging = false
let dragStart = { x: 0, y: 0 }
let posStart = { x: 0, y: 0 }
let dragMoved = false

function onDragStart(e) {
  if (e.target.closest('svg') && !e.target.closest('.drag-handle')) return
  const touch = e.touches ? e.touches[0] : e
  dragging = true
  dragMoved = false
  dragStart = { x: touch.clientX, y: touch.clientY }
  posStart = { ...pos.value }
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
  document.addEventListener('touchmove', onDragMove, { passive: false })
  document.addEventListener('touchend', onDragEnd)
}

function onDragMove(e) {
  if (!dragging) return
  const touch = e.touches ? e.touches[0] : e
  const dx = touch.clientX - dragStart.x
  const dy = touch.clientY - dragStart.y
  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true
  pos.value = {
    x: Math.max(0, Math.min(window.innerWidth - 60, posStart.x + dx)),
    y: Math.max(0, Math.min(window.innerHeight - 60, posStart.y + dy))
  }
}

function onDragEnd() {
  dragging = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onDragMove)
  document.removeEventListener('touchend', onDragEnd)
}

function toggleExpand() {
  if (!dragMoved) {
    isExpanded.value = !isExpanded.value
  }
  dragMoved = false
}

// --- Seek ---
function seekTo(e) {
  const rect = progressBar.value.getBoundingClientRect()
  const pct = ((e.clientX - rect.left) / rect.width) * 100
  player.seekTo(pct)
}
</script>

<style scoped>
.float-player {
  position: fixed;
  z-index: 9999;
  user-select: none;
}

/* Collapsed: circular cover */
.cover-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  transition: transform 0.2s, box-shadow 0.2s;
}
.cover-circle:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 28px rgba(0,0,0,0.3);
}
.cover-circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover-circle.spinning { animation: coverSpin 4s linear infinite; }
.cover-circle.spinning:hover { animation-play-state: paused; }

@keyframes coverSpin { to { transform: rotate(360deg); } }

.cover-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.4);
  pointer-events: none;
}

/* Expanded card */
.player-card {
  position: absolute;
  bottom: 64px;
  left: -130px;
  width: 280px;
  background: rgba(30, 30, 30, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 12px 16px 14px;
  color: #fff;
  box-shadow: 0 8px 40px rgba(0,0,0,0.35);
  border: 1px solid rgba(255,255,255,0.1);
}

.drag-handle {
  display: flex;
  justify-content: center;
  padding: 4px 0 8px;
  cursor: grab;
}
.handle-bar {
  width: 24px;
  height: 3px;
  border-radius: 2px;
  background: rgba(255,255,255,0.3);
}

.card-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.card-cover {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}
.card-text { min-width: 0; }
.card-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-artist {
  margin: 3px 0 0;
  font-size: 11px;
  color: rgba(255,255,255,0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Progress */
.card-progress {
  margin-bottom: 10px;
}
.progress-bg {
  width: 100%;
  height: 3px;
  background: rgba(255,255,255,0.15);
  border-radius: 2px;
  cursor: pointer;
  margin-bottom: 4px;
}
.progress-cur {
  height: 100%;
  background: linear-gradient(90deg, #fc3c44, #ff2d55);
  border-radius: 2px;
  transition: width 0.2s;
}
.time-text {
  font-size: 10px;
  color: rgba(255,255,255,0.4);
}

/* Controls */
.card-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  color: rgba(255,255,255,0.8);
}
.card-controls .el-icon {
  cursor: pointer;
  transition: color 0.15s;
}
.card-controls .el-icon:hover { color: #fc3c44; }
.play-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fc3c44, #ff2d55);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s;
}
.play-btn:hover { transform: scale(1.1); }
.close-icon {
  color: rgba(255,255,255,0.35) !important;
  margin-left: 4px;
}
.close-icon:hover { color: #fc3c44 !important; }

/* Transitions */
.fade-scale-enter-active, .fade-scale-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-scale-enter-from, .fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
