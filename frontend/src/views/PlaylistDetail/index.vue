<template>
  <div class="playlist-detail-page">
    <div class="main-content">
      <div class="back-nav" @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </div>

      <div class="info-section">
        <div class="cover">
          <img :src="playlistInfo.cover" :alt="playlistInfo.title" />
        </div>
        <div class="details">
          <div class="title-row">
            <span class="tag">歌单</span>
            <h1 class="title">{{ playlistInfo.title }}</h1>
          </div>
          <div class="creator">
            <img :src="playlistInfo.creatorAvatar" alt="creator" class="avatar" />
            <span class="name">{{ playlistInfo.creatorName }}</span>
            <span class="date">{{ playlistInfo.createDate }} 创建</span>
          </div>

          <div class="actions">
            <el-button-group class="play-group">
              <el-button type="primary" class="play-btn" @click="playAll" :loading="searchingAll">
                <el-icon><VideoPlay /></el-icon> {{ searchingAll ? '搜索中...' : '播放全部' }}
              </el-button>
              <el-button type="primary" class="add-btn">+</el-button>
            </el-button-group>

            <el-button class="action-btn" :type="collected ? 'primary' : 'default'" @click="handleCollect">
              <el-icon><FolderChecked v-if="collected" /><FolderAdd v-else /></el-icon>
              {{ collected ? '已收藏' : '收藏' }}
            </el-button>
          </div>

          <div class="tags" v-if="playlistInfo.tags && playlistInfo.tags.length">
            标签：
            <el-tag v-for="tag in playlistInfo.tags" :key="tag" type="info" class="tag-item" round size="small">
              {{ tag }}
            </el-tag>
          </div>

          <div class="desc" v-if="playlistInfo.desc">
            <p v-for="(line, index) in parsedDesc" :key="index">{{ line }}</p>
          </div>
        </div>
      </div>

      <div class="song-list-section">
        <div class="list-header">
          <div class="header-left">
            <h3>歌曲列表</h3>
            <span class="track-count">{{ realSongs.length }}首歌</span>
          </div>
          <div class="header-right">
            <span class="search-status" v-if="searchingAll">
              <el-icon class="is-loading"><Loading /></el-icon> 正在搜索歌曲...
            </span>
          </div>
        </div>

        <table class="song-table">
          <thead>
            <tr>
              <th class="col-index"></th>
              <th class="col-title">歌曲标题</th>
              <th class="col-duration">时长</th>
              <th class="col-artist">歌手</th>
              <th class="col-album">专辑</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(song, index) in realSongs" :key="song.neteaseId || song.netease_id || index"
                :class="[index % 2 === 0 ? 'even' : 'odd', { 'is-current': currentNeteaseId === (song.neteaseId || song.netease_id) }]"
                @click="playSong(song)">
              <td class="col-index">
                <span class="index" v-if="currentNeteaseId !== (song.neteaseId || song.netease_id)">{{ index + 1 }}</span>
                <el-icon class="play-icon playing" v-else><VideoPlay /></el-icon>
              </td>
              <td class="col-title">
                <div class="title-wrap">
                  <span class="song-name">{{ song.name || song.title }}</span>
                </div>
              </td>
              <td class="col-duration">{{ formatDuration(song.duration) }}</td>
              <td class="col-artist">{{ song.artist || '' }}</td>
              <td class="col-album">{{ song.album || '' }}</td>
            </tr>
            <tr v-if="realSongs.length === 0 && !searchingAll">
              <td colspan="5" class="empty-hint">点击「播放全部」搜索歌曲，或尝试手动搜索</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VideoPlay, FolderChecked, FolderAdd, ArrowLeft, Loading } from '@element-plus/icons-vue'
import { getMusicData, searchAndSaveMusic, getSavedSongs } from '@/api/index.js'
import { ElMessage } from 'element-plus'
import { isFavorited, toggleFavorite } from '@/store/favorites.js'
import { useAudioPlayer } from '@/store/audioPlayer'

const route = useRoute()
const router = useRouter()
const player = useAudioPlayer()

const playlistInfo = ref({
  id: 0, title: 'Loading...', cover: '', creatorName: '', creatorAvatar: '',
  createDate: '', tags: [], desc: [], songs: []
})

const realSongs = ref([])
const searchingAll = ref(false)
const currentNeteaseId = computed(() => player.currentSong?.neteaseId || player.currentSong?.netease_id)

const parsedDesc = computed(() => {
  const d = playlistInfo.value.desc
  if (!d) return []
  if (Array.isArray(d)) return d
  if (typeof d === 'string') {
    try { return JSON.parse(d) } catch(e) { return [d] }
  }
  return []
})

const collected = computed(() => isFavorited('music', playlistInfo.value.id))

onMounted(async () => {
  await loadPlaylist()
  // Auto-search songs
  searchAllSongs()
})

async function loadPlaylist() {
  try {
    const cachedStr = localStorage.getItem('currentPlaylist')
    if (cachedStr) {
      const cached = JSON.parse(cachedStr)
      if (cached && String(cached.id) === String(route.params.id)) {
        playlistInfo.value = cached
        import('@/api/index.js').then(({ addHistory }) => {
          addHistory({ module_name: 'music', item_id: String(cached.id), title: cached.title, cover: cached.cover })
        })
        return
      }
    }
    const musics = await getMusicData()
    const found = musics.items ? musics.items.find(m => String(m.id) === String(route.params.id)) : musics.find(m => String(m.id) === String(route.params.id))
    if (found) {
      playlistInfo.value = found
      import('@/api/index.js').then(({ addHistory }) => {
        addHistory({ module_name: 'music', item_id: String(found.id), title: found.title, cover: found.cover })
      })
    }
  } catch (e) {
    console.error(e)
  }
}

async function searchAllSongs() {
  const playlistSongs = playlistInfo.value.songs || []
  if (playlistSongs.length === 0) return

  searchingAll.value = true
  realSongs.value = []

  // For each song in this specific playlist, search by its title and get the best match
  const results = []
  for (const song of playlistSongs) {
    const title = song.title || song.name
    if (!title) continue

    try {
      // Only use the title as keyword (mock artist names are not real)
      const keyword = title
      const saved = await searchAndSaveMusic(keyword)
      if (saved) {
        results.push({
          ...saved,
          // Preserve original playlist song info for display
          originalTitle: title
        })
      }
    } catch (e) {
      console.warn('Search failed for:', title)
    }
  }

  if (results.length > 0) {
    realSongs.value = results
    ElMessage.success(`已找到 ${results.length} 首歌曲`)
  } else {
    ElMessage.warning('未搜索到匹配歌曲，请尝试点击"播放全部"重新搜索')
  }

  searchingAll.value = false
}

function playSong(song) {
  // Merge song data: ensure we have audioUrl
  const songToPlay = {
    ...song,
    id: playlistInfo.value.id,
    coverUrl: song.cover_url || song.coverUrl || playlistInfo.value.cover,
    cover_url: song.cover_url || song.coverUrl || playlistInfo.value.cover,
    audioUrl: song.audio_url || song.audioUrl,
    audio_url: song.audio_url || song.audioUrl,
    title: song.name || song.title,
    name: song.name || song.title,
  }
  player.setSong(songToPlay, realSongs.value)
}

async function playAll() {
  if (realSongs.value.length === 0) {
    await searchAllSongs()
  }
  if (realSongs.value.length === 0) {
    ElMessage.warning('没有可播放的歌曲')
    return
  }
  // Start playing from the first song
  playSong(realSongs.value[0])
}

function formatDuration(ms) {
  if (!ms) return '--:--'
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = String(totalSec % 60).padStart(2, '0')
  return `${min}:${sec}`
}

function handleCollect() {
  toggleFavorite('music', playlistInfo.value.id)
  ElMessage.success(collected.value ? '已取消收藏' : '已收藏')
}

function goBack() {
  router.back()
}
</script>

<style scoped>
.playlist-detail-page {
  max-width: 980px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  min-height: 700px;
}
.main-content { padding: 40px; }
.back-nav {
  display: inline-flex; align-items: center; color: #666; font-size: 14px;
  cursor: pointer; margin-bottom: 20px; padding: 5px 10px; border-radius: 4px; transition: background 0.2s;
}
.back-nav:hover { background: rgba(0,0,0,0.05); color: #333; }
.info-section { display: flex; margin-bottom: 40px; }
.cover { width: 200px; height: 200px; padding: 3px; border: 1px solid #ccc; margin-right: 30px; flex-shrink: 0; border-radius: 4px; }
.cover img { width: 100%; height: 100%; object-fit: cover; }
.details { flex: 1; }
.title-row { display: flex; align-items: center; margin-bottom: 12px; }
.tag { background: #c20c0c; color: #fff; padding: 2px 6px; border-radius: 3px; font-size: 12px; margin-right: 10px; }
.title { font-size: 20px; font-weight: normal; margin: 0; color: #333; }
.creator { display: flex; align-items: center; margin-bottom: 20px; font-size: 12px; color: #999; }
.avatar { width: 35px; height: 35px; margin-right: 10px; border-radius: 50%; }
.name { color: #0c73c2; margin-right: 15px; }
.actions { margin-bottom: 25px; display: flex; gap: 6px; }
.play-group { display: flex; }
.play-btn { background-color: #3b82f6; border-color: #3b82f6; border-top-right-radius: 0; border-bottom-right-radius: 0; padding: 8px 15px; }
.add-btn { background-color: #3b82f6; border-color: #3b82f6; border-top-left-radius: 0; border-bottom-left-radius: 0; border-left: 1px solid rgba(255,255,255,0.2); padding: 8px 12px; }
.action-btn { padding: 8px 12px; color: #333; }
.tags { font-size: 12px; color: #666; margin-bottom: 15px; }
.tag-item { margin-right: 8px; background: #f8f8f8; border-color: #d3d3d3; color: #666; }
.desc { font-size: 12px; color: #666; line-height: 1.8; }
.desc p { margin: 0; }

.list-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #c20c0c; padding-bottom: 5px; }
.header-left { display: flex; align-items: baseline; }
.header-left h3 { font-size: 20px; font-weight: normal; margin: 0; margin-right: 20px; color: #333; }
.track-count { font-size: 12px; color: #666; }
.header-right { font-size: 12px; color: #666; }
.search-status { display: flex; align-items: center; gap: 4px; color: #fc3c44; }

.song-table { width: 100%; border-collapse: collapse; border: 1px solid #d9d9d9; border-top: none; font-size: 12px; color: #333; }
.song-table th { text-align: left; padding: 8px 10px; background-color: #f7f7f7; background-image: linear-gradient(to bottom, #fff, #f0f0f0); border-right: 1px solid #d9d9d9; border-bottom: 1px solid #d9d9d9; font-weight: normal; color: #666; }
.song-table th:last-child { border-right: none; }
.song-table td { padding: 8px 10px; border-right: 1px solid transparent; cursor: pointer; }
.song-table tbody tr { transition: background 0.15s; }
.song-table tbody tr:hover { background: #e6f0ff !important; }
.song-table tbody tr.is-current { background: #fef0f0 !important; }
.song-table tbody tr.is-current .song-name { color: #c20c0c; font-weight: 600; }
.even { background-color: #f7f7f7; }
.odd { background-color: #fff; }

.col-index { width: 60px; text-align: center !important; color: #999; }
.index { display: inline-block; width: 25px; text-align: right; margin-right: 8px; }
.play-icon { color: #b2b2b2; font-size: 16px; vertical-align: middle; }
.play-icon.playing { color: #c20c0c; }
.col-title { width: 300px; }
.title-wrap { display: flex; align-items: center; }
.song-name { color: #333; }
.col-duration { width: 80px; color: #666; }
.col-artist { width: 120px; }
.col-album { width: 150px; }
.empty-hint { text-align: center; padding: 40px; color: #999; font-size: 14px; }
</style>
