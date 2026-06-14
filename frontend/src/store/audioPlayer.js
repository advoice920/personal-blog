import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { refreshSongUrl } from '@/api/index'

export const useAudioPlayer = defineStore('audioPlayer', () => {
  // Current song
  const currentSong = ref(null)        // { id, neteaseId, name, artist, coverUrl, audioUrl, ... }
  const playlist = ref([])             // Array of songs in the queue
  const currentIndex = ref(-1)

  // Audio element (created once on first use)
  let audioEl = null

  // Playback state
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(0.7)
  const isMuted = ref(false)

  const progress = computed(() => {
    if (duration.value === 0) return 0
    return (currentTime.value / duration.value) * 100
  })

  const formattedTime = computed(() => {
    const pad = (n) => String(Math.floor(n)).padStart(2, '0')
    return `${pad(currentTime.value / 60)}:${pad(currentTime.value % 60)}`
  })

  const formattedDuration = computed(() => {
    const pad = (n) => String(Math.floor(n)).padStart(2, '0')
    return `${pad(duration.value / 60)}:${pad(duration.value % 60)}`
  })

  function getAudio() {
    if (!audioEl) {
      audioEl = new Audio()
      audioEl.volume = volume.value

      audioEl.addEventListener('timeupdate', () => {
        currentTime.value = audioEl.currentTime
      })
      audioEl.addEventListener('loadedmetadata', () => {
        duration.value = audioEl.duration
      })
      audioEl.addEventListener('ended', () => {
        playNext()
      })
      audioEl.addEventListener('play', () => { isPlaying.value = true })
      audioEl.addEventListener('pause', () => { isPlaying.value = false })
      audioEl.addEventListener('error', async () => {
        // Audio URL expired, try refreshing
        if (currentSong.value?.neteaseId) {
          const freshUrl = await refreshSongUrl(currentSong.value.neteaseId)
          if (freshUrl) {
            const wasPlaying = isPlaying.value
            audioEl.src = freshUrl
            if (wasPlaying) audioEl.play()
          }
        }
      })
    }
    return audioEl
  }

  function setSong(song, songList = null) {
    if (songList) {
      playlist.value = songList
      currentIndex.value = songList.findIndex(s =>
        (s.neteaseId && s.neteaseId === song.neteaseId) ||
        (s.netease_id && s.netease_id === song.netease_id) ||
        s.id === song.id
      )
    } else {
      currentIndex.value = -1
    }

    currentSong.value = song
    const audio = getAudio()

    // Use stored audioUrl or fetch fresh one
    const url = song.audioUrl || song.audio_url
    if (url) {
      audio.src = url
      audio.play().catch(e => console.warn('Audio play blocked:', e))
    }
  }

  function togglePlay() {
    if (!currentSong.value) return
    const audio = getAudio()
    if (isPlaying.value) {
      audio.pause()
    } else {
      audio.play().catch(e => console.warn('Audio play blocked:', e))
    }
  }

  function seekTo(percent) {
    const audio = getAudio()
    audio.currentTime = (percent / 100) * duration.value
  }

  function setVolume(val) {
    const audio = getAudio()
    volume.value = val
    audio.volume = val
    isMuted.value = val === 0
  }

  function toggleMute() {
    const audio = getAudio()
    isMuted.value = !isMuted.value
    audio.volume = isMuted.value ? 0 : volume.value
  }

  function playNext() {
    if (playlist.value.length === 0 || currentIndex.value < 0) return
    const nextIndex = (currentIndex.value + 1) % playlist.value.length
    const nextSong = playlist.value[nextIndex]
    if (nextSong) {
      currentIndex.value = nextIndex
      setSong(nextSong)
    }
  }

  function playPrev() {
    if (playlist.value.length === 0 || currentIndex.value < 0) return
    const prevIndex = (currentIndex.value - 1 + playlist.value.length) % playlist.value.length
    const prevSong = playlist.value[prevIndex]
    if (prevSong) {
      currentIndex.value = prevIndex
      setSong(prevSong)
    }
  }

  return {
    currentSong,
    playlist,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    progress,
    formattedTime,
    formattedDuration,
    setSong,
    togglePlay,
    seekTo,
    setVolume,
    toggleMute,
    playNext,
    playPrev,
  }
})
