const axios = require('axios');
const url = 'https://apis.tianapi.com/travel/index?key=ec7b449dff1e02a2bf6dd10790259747&num=2&page=1';
axios.get(url).then(response => {
  const apiData = response.data?.result?.newslist;
  const mappedItems = apiData.map(item => {
    let imgUrl = item.picUrl;
    if (!imgUrl || imgUrl.trim() === '') {
      const fallbackKeywords = item.title ? item.title.substring(0, 12) : '风景 旅游';
      imgUrl = `https://tse2-mm.cn.bing.net/th?q=${encodeURIComponent(fallbackKeywords)}&w=400&h=600&c=7&rs=1&p=0&dpr=1&pid=1.7&mkt=zh-CN&adlt=moderate`;
    }
    return {
      id: item.id || Math.random().toString(36).substr(2, 9),
      title: item.title,
      summary: item.description || '点击查看文旅详情...',
      thumbnail: imgUrl,
      cover: imgUrl,
      url: item.url,
      category: 'travel',
      tags: [item.source || '文旅资讯'],
      views: Math.floor(Math.random() * 50000) + 1000, 
      likes: Math.floor(Math.random() * 5000) + 100,
      comments: Math.floor(Math.random() * 500),
      createdAt: item.ctime,
      created_at: item.ctime,
      author: {
        name: item.source || '特约作者',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.source || '作者')}`
      }
    }
  });
  console.log(JSON.stringify({ items: mappedItems, total: response.data.result.allnum }, null, 2));
}).catch(console.error);
