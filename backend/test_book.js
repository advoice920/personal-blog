const axios = require('axios');

async function test() {
  const isbn = '9787115546081'; // test isbn
  const appKey = '2d0D6cfb0Cc046a1AbE5b9019141E604';
  
  try {
    const res = await axios.post('https://route.showapi.com/1626-1', 
      new URLSearchParams({ isbn: isbn }).toString(), 
      {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'appKey': appKey 
        }
      }
    );
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('ShowAPI failed:', err.response ? err.response.status : err.message);
  }
}

test();
