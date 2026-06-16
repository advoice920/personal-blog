const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const sqlitePath = path.join(__dirname, '../frontend/public/mock.sqlite');

const newBooks = [
  {
    title: '三体',
    author: '刘慈欣',
    rating: 9.5,
    cover: 'https://img9.doubanio.com/view/subject/s/public/s2768378.jpg',
    tags: JSON.stringify(['科幻', '雨果奖', '中国文学']),
    summary: '文化大革命如火如荼进行的同时，军方探寻外星文明的绝秘计划“红岸工程”取得了突破性进展...',
    review: '一部让人仰望星空的伟大作品。',
    quote: '给岁月以文明，而不是给文明以岁月。'
  },
  {
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    rating: 9.3,
    cover: 'https://img9.doubanio.com/view/subject/s/public/s6384944.jpg',
    tags: JSON.stringify(['魔幻现实主义', '经典', '拉美文学']),
    summary: '马贡多小镇和布恩迪亚家族的百年兴衰史...',
    review: '一部波澜壮阔的史诗，魔幻与现实的完美结合。',
    quote: '生命中真正重要的不是你遭遇了什么，而是你记住了哪些事，又是如何铭记的。'
  },
  {
    title: '1984',
    author: '乔治·奥威尔',
    rating: 9.4,
    cover: 'https://img9.doubanio.com/view/subject/s/public/s29053580.jpg',
    tags: JSON.stringify(['反乌托邦', '政治', '经典']),
    summary: '在1984年的大洋国，老大哥在看着你...',
    review: '一部让人脊背发凉的政治寓言。',
    quote: '战争即和平，无知即力量，自由即奴役。'
  },
  {
    title: '红楼梦',
    author: '曹雪芹',
    rating: 9.6,
    cover: 'https://img9.doubanio.com/view/subject/s/public/s1070959.jpg',
    tags: JSON.stringify(['古典文学', '名著', '中国文学']),
    summary: '以贾、史、王、薛四大家族为背景，以贾宝玉和林黛玉的爱情悲剧为主线...',
    review: '中国古代长篇小说的巅峰之作。',
    quote: '满纸荒唐言，一把辛酸泪。都云作者痴，谁解其中味？'
  },
  {
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    rating: 9.1,
    cover: 'https://img9.doubanio.com/view/subject/s/public/s27279654.jpg',
    tags: JSON.stringify(['历史', '科普', '社科']),
    summary: '十万年前，地球上至少有六种不同的人...',
    review: '以宏大的视角重塑了对人类历史的认知。',
    quote: '想象构建了人类社会的秩序。'
  },
  {
    title: '解忧杂货店',
    author: '东野圭吾',
    rating: 8.5,
    cover: 'https://img9.doubanio.com/view/subject/s/public/s27922118.jpg',
    tags: JSON.stringify(['治愈', '日本文学', '小说']),
    summary: '僻静的街道旁有一家杂货店，只要写下烦恼投进卷帘门的投信口...',
    review: '温暖人心的奇幻温情之作。',
    quote: '你的地图是一张白纸，所以即使想决定目的地，也不知道路在哪里。'
  },
  {
    title: '追风筝的人',
    author: '卡勒德·胡赛尼',
    rating: 8.9,
    cover: 'https://img9.doubanio.com/view/subject/s/public/s1727290.jpg',
    tags: JSON.stringify(['小说', '阿富汗', '人性']),
    summary: '12岁的阿富汗富家少爷阿米尔与仆人哈桑情同手足...',
    review: '为你，千千万万遍。',
    quote: '被真相伤害总比被谎言欺骗的好。'
  },
  {
    title: '活着',
    author: '余华',
    rating: 9.4,
    cover: 'https://img9.doubanio.com/view/subject/s/public/s27264181.jpg',
    tags: JSON.stringify(['当代文学', '经典', '中国小说']),
    summary: '地主少爷福贵嗜赌成性，终于输光了家业一贫如洗...',
    review: '生命中不可承受之重，也是生命中最坚韧的力量。',
    quote: '人是为了活着本身而活着的，而不是为了活着之外的任何事物所活着。'
  },
  {
    title: '霍乱时期的爱情',
    author: '加西亚·马尔克斯',
    rating: 9.0,
    cover: 'https://img9.doubanio.com/view/subject/s/public/s11284102.jpg',
    tags: JSON.stringify(['爱情', '拉美文学', '名著']),
    summary: '弗洛伦蒂诺与费尔明娜跨越半个多世纪的爱情故事...',
    review: '一部关于爱情的百科全书。',
    quote: '爱情始终是爱情，只不过距离死亡越近，爱就越浓郁。'
  },
  {
    title: '局外人',
    author: '阿尔贝·加缪',
    rating: 9.0,
    cover: 'https://img9.doubanio.com/view/subject/s/public/s4358055.jpg',
    tags: JSON.stringify(['存在主义', '法国文学', '哲学']),
    summary: '默尔索在母亲葬礼上没有流泪，甚至在杀人后也显得无动于衷...',
    review: '荒诞世界的冷峻观察。',
    quote: '我知道这世界我无处容身，只是，你凭什么审判我的灵魂？'
  },
  {
    title: '白夜行',
    author: '东野圭吾',
    rating: 9.2,
    cover: 'https://img9.doubanio.com/view/subject/s/public/s29800254.jpg',
    tags: JSON.stringify(['悬疑', '推理', '日本文学']),
    summary: '一场由童年阴影引发的跨越二十年的罪恶与救赎...',
    review: '唯有太阳与人心不可直视。',
    quote: '我的天空里没有太阳，总是黑夜，但并不暗，因为有东西代替了太阳。'
  },
  {
    title: '原则',
    author: '瑞·达利欧',
    rating: 8.4,
    cover: 'https://img9.doubanio.com/view/subject/s/public/s29631790.jpg',
    tags: JSON.stringify(['商业', '管理', '自我提升']),
    summary: '桥水基金创始人瑞·达利欧的个人与工作生活原则...',
    review: '极度求真，极度透明的行动指南。',
    quote: '考察影响你的那些事物的规律，从而理解其背后的因果关系。'
  }
];

const db = new sqlite3.Database(sqlitePath, (err) => {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

db.serialize(() => {
  const stmt = db.prepare('INSERT INTO reading (title, author, rating, cover, tags, summary, review, quote) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  newBooks.forEach(book => {
    stmt.run([book.title, book.author, book.rating, book.cover, book.tags, book.summary, book.review, book.quote], (err) => {
      if (err) console.error('Error inserting book:', err.message);
    });
  });
  stmt.finalize(() => {
    console.log('Successfully inserted new books.');
    db.close();
  });
});
