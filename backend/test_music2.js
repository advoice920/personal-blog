const axios = require('axios');
async function test() {
  const url = 'https://apis.tianapi.com/music/index?key=ec7b449dff1e02a2bf6dd10790259747';
  try {
    const res = await axios.get(url);
    console.log(JSON.stringify(res.data, null, 2));
  } catch(e) {
    console.error(e.message);
  }
}
test();
