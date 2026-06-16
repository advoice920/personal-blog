const axios = require('axios');
async function test() {
  const apiKey = '123068646a36df8764e6205eaa2b67a5';
  const url = `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}&language=zh-CN&page=1`;
  try {
    const res = await axios.get(url, { timeout: 10000 });
    console.log("Success! First movie:", res.data.results[0].title);
  } catch (e) {
    console.error("Failed:", e.message);
  }
}
test();
