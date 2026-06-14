const fs = require('fs');
const path = require('path');
const dir = 'E:/AIproject/bloger_backup/frontend/src/views/Home/components';

['TravelBoard.vue', 'FoodBoard.vue', 'FashionBoard.vue', 'SportsBoard.vue', 'PhotoBoard.vue', 'ReadingBoard.vue', 'MovieBoard.vue'].forEach(f => {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');
  let originalEnding = content.includes('\r\n') ? '\r\n' : '\n';
  content = content.replace(/\r\n/g, '\n');
  
  // 1. Add import
  if (!content.includes('addHistory')) {
    content = content.replace(/import \{.*\} from '@\/api\/index\.js'/, match => {
      if(match.includes('addHistory')) return match;
      return match.replace('}', ', addHistory }');
    });
  }

  // 2. Add function call
  let moduleName = f.replace('Board.vue', '').toLowerCase();
  
  if (f === 'PhotoBoard.vue') {
     content = content.replace(/@dblclick="openPreview\(photo\.url\)"/g, '@dblclick="openPreview(photo)"');
     content = content.replace(/const openPreview = \(url\) => \{\n  previewUrl\.value = url\n  showViewer\.value = true\n\}/g, 
       `const openPreview = (photo) => {\n  previewUrl.value = photo.url\n  showViewer.value = true\n  addHistory({ module_name: 'photo', item_id: String(photo.id), title: photo.title, cover: photo.url });\n}`);
     content = content.replace(/const openPreview = \(url\) => \{\n  showViewer\.value = true\n\}/g, 
       `const openPreview = (photo) => {\n  previewUrl.value = photo.url\n  showViewer.value = true\n  addHistory({ module_name: 'photo', item_id: String(photo.id), title: photo.title, cover: photo.url });\n}`);
  } else if (f === 'MovieBoard.vue') {
     content = content.replace(/<div class="movie-card" v-for="fav in favoriteMovies" :key="fav\.id">/g, 
        `<div class="movie-card" v-for="fav in favoriteMovies" :key="fav.id" @click="addHistory({ module_name: 'movie', item_id: String(fav.id), title: fav.title, cover: fav.cover })">`);
     content = content.replace(/<div class="movie-card" v-for="movie in filteredMovies" :key="movie\.id">/g, 
        `<div class="movie-card" v-for="movie in filteredMovies" :key="movie.id" @click="addHistory({ module_name: 'movie', item_id: String(movie.id), title: movie.title, cover: movie.cover })">`);
     content = content.replace(/const setActiveIndex = \(index\) => \{\n  activeIndex\.value = index\n  if \(index > 2\) \{\n    slideOffset\.value = \(index - 2\) \* 160\n  \} else \{\n    slideOffset\.value = 0\n  \}\n\}/g,
       `const setActiveIndex = (index) => {\n  activeIndex.value = index\n  if (index > 2) {\n    slideOffset.value = (index - 2) * 160\n  } else {\n    slideOffset.value = 0\n  }\n  const movie = hotMovies.value[index]\n  if(movie) {\n    addHistory({ module_name: 'movie', item_id: String(movie.id), title: movie.title, cover: movie.cover });\n  }\n}`);
  } else {
     const regex = new RegExp(`const open([A-Za-z]+) = \\(([^)]+)\\) => \\{[\\s\\S]*?show([A-Za-z]+)\\.value = true(?:\\s*\\n)?`);
     content = content.replace(regex, match => {
       if (match.includes('addHistory(')) return match;
       let arg = match.match(/\(([^)]+)\)/)[1];
       return match + `  addHistory({ module_name: '${moduleName}', item_id: String(${arg}.id), title: ${arg}.title, cover: ${arg}.cover || ${arg}.image });\n`;
     });
  }

  content = content.replace(/\n/g, originalEnding);
  fs.writeFileSync(p, content);
  console.log('Patched smartly ' + f);
});
