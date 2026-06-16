import { reactive, watch } from 'vue'

const saved = localStorage.getItem('blog-favorites')
const defaultState = {
  article: [],
  food: [],
  travel: [],
  reading: [],
  fashion: [],
  sports: [],
  photo: [],
  music: [],
  movie: []
}

export const favoritesState = reactive(saved ? JSON.parse(saved) : defaultState)

// Persist state to localStorage on any change
watch(favoritesState, (newState) => {
  localStorage.setItem('blog-favorites', JSON.stringify(newState))
}, { deep: true })

export const toggleFavorite = (category, id) => {
  const list = favoritesState[category]
  if (!list) {
    favoritesState[category] = [id]
  } else {
    const idx = list.indexOf(id)
    if (idx > -1) {
      list.splice(idx, 1)
    } else {
      list.push(id)
    }
  }
}

export const isFavorited = (category, id) => {
  return favoritesState[category]?.includes(id) || false
}
