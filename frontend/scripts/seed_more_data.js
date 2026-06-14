import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import initSqlJs from 'sql.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 随机辅助函数
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const generateRandomDate = () => `2026-0${randomInt(1, 6)}-${String(randomInt(1, 28)).padStart(2, '0')}`;

// 数据模板
const authorNames = ['张伟', '李娜', '王磊', '刘洋', '陈静', '杨晨', '赵宇', '黄婷', '周健', '吴芳', '阿桃', '深夜食客', '旅行日记', '光影记录', '读书人', '音乐分享', '电影发烧友', '跑步爱好者', '时尚穿搭'];
const avatars = Array.from({length: 20}, (_, i) => `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`);

// 1. Article Data (20 items)
const articleData = Array.from({ length: 20 }, (_, i) => {
  const topics = ['前端开发', '人工智能', '生活随笔', '职场心得', '技术架构'];
  const titles = [
    `如何在2026年保持前端竞争力 (${i+1})`, `深入理解Vue3响应式原理之${i}`, `我的北漂生活记录 (第${i}篇)`, `产品经理的日常吐槽 (${i})`, `微前端架构实践指南 V${i}.0`
  ];
  return {
    title: randomItem(titles),
    category: randomItem(topics),
    summary: `这是一篇关于${topics[i%5]}的深度长文，总结了近年来的经验与教训，希望能给大家带来一些启发。`,
    content: `## 背景\n\n在这个快速发展的时代，掌握核心技术和正确的方法论至关重要。\n\n## 核心观点\n\n1. 持续学习。\n2. 保持好奇心。\n3. 注重实践。\n\n## 总结\n\n希望大家都能在自己的领域有所建树。`,
    views: randomInt(1000, 50000),
    likes: randomInt(100, 5000),
    tags: JSON.stringify([topics[i%5], '干货', '分享']),
    author_name: randomItem(authorNames),
    author_avatar: randomItem(avatars),
    thumbnail: `https://picsum.photos/seed/article${i}/800/400`,
    createdAt: generateRandomDate()
  }
});

// 2. Food Data (20 items)
const foodNames = ['红烧肉', '清蒸鲈鱼', '宫保鸡丁', '麻婆豆腐', '糖醋排骨', '水煮鱼', '鱼香肉丝', '酸菜鱼', '回锅肉', '青椒肉丝', '红烧茄子', '番茄炒蛋', '蒜蓉西兰花', '干锅包菜', '地三鲜', '辣子鸡', '粉蒸肉', '东坡肉', '叫花鸡', '剁椒鱼头'];
const foodData = foodNames.map((name, i) => {
  return {
    title: `家常美味 | 正宗${name}的做法`,
    author: randomItem(authorNames),
    time: `${randomInt(15, 60)} 分钟`,
    calories: `${randomInt(300, 1000)} kcal`,
    rating: (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1),
    img: `https://picsum.photos/seed/food${i}/600/600`,
    height: randomInt(300, 500),
    ingredients: JSON.stringify([
      { name: "主料", amount: "500g" },
      { name: "葱姜蒜", amount: "适量" },
      { name: "生抽", amount: "2勺" },
      { name: "老抽", amount: "1勺" },
      { name: "料酒", amount: "1勺" },
      { name: "盐糖", amount: "少许" }
    ]),
    steps: JSON.stringify([
      "1. 准备好所有食材，将主料清洗干净切块备用。",
      "2. 葱切段，姜切片，蒜拍碎备用。",
      "3. 锅中倒油，烧热后放入葱姜蒜爆香。",
      "4. 放入主料翻炒至变色，加入料酒、生抽、老抽翻炒均匀。",
      "5. 加入适量清水，大火烧开后转小火慢炖，期间注意观察火候。",
      "6. 待汤汁浓稠时，加入少许盐和糖调味。",
      "7. 大火收汁，撒上葱花即可出锅，美味的家常菜就做好了！"
    ])
  }
});

// 3. Travel Data (20 items)
const cities = ['北京', '上海', '广州', '深圳', '成都', '重庆', '杭州', '西安', '南京', '武汉', '长沙', '苏州', '厦门', '青岛', '大连', '三亚', '昆明', '丽江', '大理', '桂林'];
const travelData = cities.map((city, i) => {
  return {
    title: `${city}三日游：探寻城市深处的烟火气`,
    location: city,
    duration: "3天2晚",
    img: `https://picsum.photos/seed/travel${i}/600/800`,
    text: `这次来到${city}，避开了人挤人的热门景点，专门去街头巷尾寻找最地道的美食和最真实的风土人情。事实证明，这才是打开${city}的最佳方式。`,
    itinerary: JSON.stringify([
      `Day 1: 抵达${city}，入住老城区民宿。下午漫步历史街区，品尝当地特色小吃。`,
      `Day 2: 深入当地市场，感受浓浓的烟火气。下午打卡小众网红咖啡馆，傍晚欣赏城市夜景。`,
      `Day 3: 参观当地特色博物馆，购买伴手礼，愉快返程。`
    ]),
    tips: JSON.stringify([
      "1. 建议穿着舒适的平底鞋，因为会有较多步行。",
      "2. 体验当地美食不要只看网红店，路边苍蝇馆子往往有惊喜。",
      "3. 提前查好天气预报，备好雨具或防晒用品。"
    ])
  }
});

// 4. Photo Data (20 items)
const photoCategories = ['纪实·人文', '自然·风光', '城市·建筑', '人像·街拍', '微距·静物'];
const photoData = Array.from({ length: 20 }, (_, i) => {
  const width = randomItem([600, 800, 1000]);
  const height = randomItem([400, 600, 800]);
  return {
    title: `光影瞬间 - 随手拍系列 ${i+1}`,
    author: randomItem(authorNames),
    avatar: randomItem(avatars),
    likes: randomInt(100, 10000),
    views: `${randomInt(1, 100)}k`,
    url: `https://picsum.photos/seed/photo${i}/${width}/${height}`,
    width: width,
    height: height,
    category: photoCategories[i % 5]
  }
});

// 5. Reading Data (20 items)
const bookNames = ['人类简史', '三体', '活着', '追风筝的人', '解忧杂货店', '白夜行', '平凡的世界', '红楼梦', '围城', '1984', '原则', '刻意练习', '思考，快与慢', '穷爸爸富爸爸', '影响力', '自控力', '乌合之众', '非暴力沟通', '沉思录', '毛泽东选集'];
const readingData = bookNames.map((name, i) => {
  return {
    title: name,
    author: `作者${i+1}`,
    rating: (Math.random() * (10.0 - 8.0) + 8.0).toFixed(1),
    cover: `https://picsum.photos/seed/book${i}/400/600`,
    tags: JSON.stringify(['经典好书', '必读推荐', '深度思考']),
    summary: `《${name}》是一本极具启发性的佳作，全方位探讨了相关领域的深刻命题，让人手不释卷。`,
    review: `读完《${name}》，我深受震撼。书中的观点新颖而深刻，彻底颠覆了我以往的认知。强烈推荐给每一个渴望成长和思考的人。`,
    quote: "人生如逆旅，我亦是行人。——《苏轼》 (配图语录)"
  }
});

// 6. Music Data (20 items)
const musicData = Array.from({ length: 20 }, (_, i) => {
  return {
    title: `周末放松指南｜精选歌单 ${i+1}`,
    cover: `https://picsum.photos/seed/music${i}/400/400`,
    creatorName: randomItem(authorNames),
    creatorAvatar: randomItem(avatars),
    createDate: generateRandomDate(),
    favCount: `${randomInt(1, 99)}万`,
    shareCount: `${randomInt(1, 20)}万`,
    commentCount: `${randomInt(500, 9999)}`,
    tags: JSON.stringify(['放松', '周末', '治愈', '流行']),
    desc: JSON.stringify([
      "这是一张适合在周末午后安静聆听的歌单。",
      "泡一杯咖啡，拿一本好书，让音符洗涤一周的疲惫。"
    ]),
    trackCount: randomInt(10, 30),
    playCount: randomInt(1000000, 9999999),
    songs: JSON.stringify(Array.from({ length: 5 }, (_, j) => ({
      id: i * 100 + j,
      name: `好听的歌曲名 ${j+1}`,
      duration: `0${randomInt(3, 5)}:${String(randomInt(0, 59)).padStart(2, '0')}`,
      artist: `知名歌手 ${j+1}`,
      album: `经典专辑 ${j+1}`,
      hasMv: Math.random() > 0.5
    })))
  }
});

// 7. Movie Data (20 items)
const movieNames = ['肖申克的救赎', '霸王别姬', '阿甘正传', '泰坦尼克号', '千与千寻', '美丽人生', '星际穿越', '盗梦空间', '楚门的世界', '忠犬八公的故事', '海上钢琴师', '大话西游', '放牛班的春天', '疯狂动物城', '无间道', '当幸福来敲门', '怦然心动', '触不可及', '蝙蝠侠', '教父'];
const movieData = movieNames.map((name, i) => {
  return {
    title: name,
    rating: (Math.random() * (10.0 - 8.5) + 8.5).toFixed(1),
    year: `${1990 + randomInt(0, 35)}`,
    director: `著名导演 ${i+1}`,
    genre: randomItem(['剧情·文艺', '科幻·动作', '喜剧·爱情', '悬疑·犯罪']),
    cover: `https://picsum.photos/seed/movie${i}/400/600`,
    desc: `《${name}》是一部影史经典，讲述了一段跌宕起伏的动人故事。精湛的演技和深刻的主题让人回味无穷。`,
    tags: JSON.stringify(['影史经典', '高分神作', '必看系列']),
    rank: i + 1
  }
});

// 8. Sports Data (20 items)
const sportsData = Array.from({ length: 20 }, (_, i) => {
  return {
    title: `周末晨练打卡 - 沿河绿道跑 ${i+1}`,
    type: randomItem(['Running', 'Cycling', 'Hiking']),
    distance: `${(Math.random() * 10 + 3).toFixed(2)} km`,
    pace: `0${randomInt(4, 6)}:${randomInt(10, 59)} /km`,
    hr: `${randomInt(130, 170)} bpm`,
    map: `https://picsum.photos/seed/sports${i}/800/400`,
    date: generateRandomDate(),
    elevation: `${randomInt(20, 200)} m`,
    calories: `${randomInt(300, 800)} kcal`,
    description: `今天天气非常不错，早起迎着朝阳晨练。微风拂面，空气清新，配速控制得还算稳定。运动完大汗淋漓的感觉真爽！继续保持。`,
    splits: JSON.stringify(Array.from({ length: 5 }, (_, j) => ({
      km: j + 1,
      pace: `0${randomInt(4, 6)}:${randomInt(10, 59)}`
    })))
  }
});

// 9. Fashion Data (20 items)
const fashionData = Array.from({ length: 20 }, (_, i) => {
  const brands = ['优衣库', 'ZARA', 'H&M', 'COS', 'UR', 'NIKE', 'adidas', 'Vans'];
  return {
    title: `OOTD日常穿搭分享 - 简约舒适风 ${i+1}`,
    brand: `${randomItem(brands)} × ${randomItem(brands)}`,
    img: `https://picsum.photos/seed/fashion${i}/600/800`,
    text: `今天尝试了非常基础的极简搭配，注重面料的质感和颜色的呼应。越是简单的衣服，越能凸显个人的气质。`,
    designer: `独立穿搭博主 ${i+1}`,
    collection: `Autumn/Winter 2026 Look ${i+1}`,
    detailedReview: `这套搭配的核心在于色彩的统一和层次的营造。上衣选择了挺括的材质，下装搭配宽松版型，整体呈现慵懒随性的感觉。鞋子作为点睛之笔，提升了整套look的时尚度。适合日常通勤和周末逛街。`,
    lookbook: JSON.stringify([
      `https://picsum.photos/seed/fashion_lb1_${i}/600/800`,
      `https://picsum.photos/seed/fashion_lb2_${i}/600/800`
    ])
  }
});

// 执行插入操作
async function insertMoreData() {
  console.log('Loading SQLite database...')
  const dbBuffer = fs.readFileSync(path.join(__dirname, '../public/mock.sqlite'))
  const SQL = await initSqlJs()
  const db = new SQL.Database(dbBuffer)

  const insertData = (table, columns, dataArray) => {
    const placeholders = columns.map(() => '?').join(', ')
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
    const stmt = db.prepare(sql)
    for (const row of dataArray) {
      const values = columns.map(col => {
        let val = row[col]
        if (typeof val === 'object') return JSON.stringify(val)
        if (val === undefined || val === null) return ''
        return val
      })
      stmt.run(values)
    }
    stmt.free()
    console.log(`Inserted ${dataArray.length} items into table '${table}'.`)
  }

  insertData('article', ['title', 'category', 'summary', 'content', 'views', 'likes', 'tags', 'author_name', 'author_avatar', 'thumbnail', 'createdAt'], articleData)
  insertData('food', ['title', 'author', 'time', 'calories', 'rating', 'img', 'height', 'ingredients', 'steps'], foodData)
  insertData('travel', ['title', 'location', 'duration', 'img', 'text', 'itinerary', 'tips'], travelData)
  insertData('photo', ['title', 'author', 'avatar', 'likes', 'views', 'url', 'width', 'height', 'category'], photoData)
  insertData('reading', ['title', 'author', 'rating', 'cover', 'tags', 'summary', 'review', 'quote'], readingData)
  insertData('music', ['title', 'cover', 'creatorName', 'creatorAvatar', 'createDate', 'favCount', 'shareCount', 'commentCount', 'tags', 'desc', 'trackCount', 'playCount', 'songs'], musicData)
  insertData('movie', ['title', 'rating', 'year', 'director', 'genre', 'cover', 'desc', 'tags', 'rank'], movieData)
  insertData('sports', ['title', 'type', 'distance', 'pace', 'hr', 'map', 'date', 'elevation', 'calories', 'description', 'splits'], sportsData)
  insertData('fashion', ['title', 'brand', 'img', 'text', 'designer', 'collection', 'detailedReview', 'lookbook'], fashionData)

  const newData = db.export()
  const buffer = Buffer.from(newData)
  fs.writeFileSync(path.join(__dirname, '../public/mock.sqlite'), buffer)
  console.log('Database saved successfully to public/mock.sqlite!')
}

insertMoreData().catch(console.error)
