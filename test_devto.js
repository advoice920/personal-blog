const axios = require('axios');

async function test() {
  try {
    const response = await axios.get(`https://dev.to/api/articles?page=1&per_page=10`, { timeout: 3000 });
    const devToData = response.data;
    
    const mappedItems = devToData.map(item => ({
      id: item.id,
      title: item.title,
      summary: item.description,
      cover: item.cover_image || item.social_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80',
      category: 'article',
      tags: item.tag_list || [],
      views: item.public_reactions_count * 15 + Math.floor(Math.random() * 1000), 
      likes: item.public_reactions_count,
      comments: item.comments_count,
      created_at: item.published_at,
      author: {
        name: item.user.name,
        avatar: item.user.profile_image
      }
    }));
    console.log('Success, items:', mappedItems.length);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
