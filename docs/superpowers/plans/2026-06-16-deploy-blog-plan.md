# 博客部署 Vercel + Zeabur — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将博客项目部署到 Vercel（前端）和 Zeabur（后端+MySQL），全国内可访问。

**Architecture:** Vercel 托管 Vue SPA 静态文件并反向代理 /api 请求到 Zeabur；Zeabur 运行 Docker 容器（Node.js + Express），内置 MySQL 数据库。

**Tech Stack:** Node.js 22 Alpine, Docker, Vercel CLI, GitHub

---

### Task 1: Dockerfile — 后端容器化

**Files:**
- Create: `Dockerfile`（项目根目录）

- [ ] **Step 1: 创建 Dockerfile**

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
EXPOSE 3000
CMD ["node", "server.js"]
```

- [ ] **Step 2: 本地构建测试**

```bash
docker build -t blog-backend .
```

- [ ] **Step 3: 提交**

```bash
git add Dockerfile
git commit -m "feat: add Dockerfile for containerized deployment"
```

---

### Task 2: vercel.json — 前端部署配置

**Files:**
- Create: `vercel.json`（项目根目录）

- [ ] **Step 1: 创建 vercel.json**

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://<ZEABUR_BACKEND_URL>/api/:path*"
    }
  ]
}
```

> `<ZEABUR_BACKEND_URL>` 后续替换为 Zeabur 分配的实际域名。

- [ ] **Step 2: 确认 vite.config.js 无影响**

`frontend/vite.config.js` 中的 dev proxy 仅用于本地开发，Vercel 生产环境不受影响，无需修改。

- [ ] **Step 3: 提交**

```bash
git add vercel.json
git commit -m "feat: add vercel.json for Vercel frontend deployment"
```

---

### Task 3: 后端 server.js — 启动时自动初始化数据库

**Files:**
- Modify: `backend/server.js:48`

- [ ] **Step 1: 在 server.listen 回调中添加数据库自动初始化**

将第 48-51 行改为：

```js
app.listen(port, async () => {
  console.log(`Server listening at http://localhost:${port}`);

  // Auto-init database tables (idempotent)
  try {
    const initDB = require('./init_db_auto');
    await initDB();
    console.log('[DB] Auto-init complete');
  } catch (e) {
    console.warn('[DB] Auto-init failed (may already exist):', e.message);
  }

  // Auto-fetch RSS on startup, then every 6 hours
  try {
    const rssService = require('./services/rssService');
    const count = await rssService.fetchAllAndSave();
    console.log(`[RSS] Startup fetch: ${count} new articles`);
  } catch (e) {
    console.warn('[RSS] Startup fetch failed:', e.message);
  }
  // ... rest unchanged
```

但 `init_db.js` 是手动脚本，不适合作为模块调用。更好的做法：创建一个轻量的 `init_db_auto.js` 只做 `CREATE TABLE IF NOT EXISTS`，不做数据导入。

- [ ] **Step 2: 创建 backend/init_db_auto.js**

```js
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initTables() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'bloger_db',
  });

  const tables = {
    users: `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(128) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'user') DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    articles: `CREATE TABLE IF NOT EXISTS articles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255), category VARCHAR(100), link VARCHAR(500), source VARCHAR(100),
      cover VARCHAR(500), summary TEXT, content LONGTEXT, views INT DEFAULT 0,
      likes INT DEFAULT 0, tags JSON, author_name VARCHAR(100), author_avatar VARCHAR(255),
      thumbnail VARCHAR(255), createdAt VARCHAR(255),
      status ENUM('published', 'draft') DEFAULT 'published',
      is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    music: `CREATE TABLE IF NOT EXISTS music (
      id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), cover VARCHAR(255),
      creatorName VARCHAR(100), creatorAvatar VARCHAR(255), createDate VARCHAR(100),
      favCount VARCHAR(50), shareCount VARCHAR(50), commentCount VARCHAR(50),
      tags JSON, \`desc\` JSON, trackCount INT, playCount INT, songs JSON,
      status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    movie: `CREATE TABLE IF NOT EXISTS movie (
      id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), rating FLOAT, year VARCHAR(20),
      director VARCHAR(100), genre VARCHAR(100), cover VARCHAR(255), \`desc\` TEXT,
      tags JSON, \`rank\` INT, is_deleted BOOLEAN DEFAULT FALSE,
      status ENUM('published', 'draft') DEFAULT 'published',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    travel: `CREATE TABLE IF NOT EXISTS travel (
      id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), location VARCHAR(255),
      duration VARCHAR(100), img VARCHAR(255), text TEXT, itinerary JSON, tips JSON,
      status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    photo: `CREATE TABLE IF NOT EXISTS photo (
      id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), author VARCHAR(100),
      avatar VARCHAR(255), likes INT DEFAULT 0, views VARCHAR(50), url VARCHAR(500),
      width INT, height INT, category VARCHAR(100),
      status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    fashion: `CREATE TABLE IF NOT EXISTS fashion (
      id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), brand VARCHAR(100),
      img VARCHAR(255), text TEXT, designer VARCHAR(100), collection VARCHAR(100),
      detailedReview TEXT, lookbook JSON,
      status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    reading: `CREATE TABLE IF NOT EXISTS reading (
      id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), author VARCHAR(100),
      rating FLOAT, cover VARCHAR(255), tags JSON, summary TEXT, review TEXT, quote TEXT,
      status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    food: `CREATE TABLE IF NOT EXISTS food (
      id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), author VARCHAR(100),
      time VARCHAR(100), calories VARCHAR(100), rating VARCHAR(20), img VARCHAR(255),
      height INT, ingredients JSON, steps JSON,
      status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    sports: `CREATE TABLE IF NOT EXISTS sports (
      id VARCHAR(128) PRIMARY KEY, title VARCHAR(255), type VARCHAR(100), distance VARCHAR(50),
      pace VARCHAR(50), hr VARCHAR(50), map VARCHAR(255), date VARCHAR(50), elevation VARCHAR(50),
      calories VARCHAR(50), description TEXT, splits JSON,
      status ENUM('published', 'draft') DEFAULT 'published', is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    songs: `CREATE TABLE IF NOT EXISTS songs (
      id INT AUTO_INCREMENT PRIMARY KEY, netease_id BIGINT UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL, artist VARCHAR(255), album VARCHAR(255),
      duration INT DEFAULT 0, cover_url VARCHAR(500), audio_url VARCHAR(800), lyrics TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    comments: `CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY, module_name VARCHAR(50) NOT NULL,
      item_id INT NOT NULL, user_id INT, content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )`,
    likes_interaction: `CREATE TABLE IF NOT EXISTS likes_interaction (
      id INT AUTO_INCREMENT PRIMARY KEY, module_name VARCHAR(50) NOT NULL,
      item_id VARCHAR(128) NOT NULL, user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY user_item_module (user_id, item_id, module_name)
    )`,
    history: `CREATE TABLE IF NOT EXISTS history (
      id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, module_name VARCHAR(50) NOT NULL,
      item_id VARCHAR(128) NOT NULL, title VARCHAR(255), cover VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY user_item_module (user_id, item_id, module_name)
    )`,
  };

  for (const [name, sql] of Object.entries(tables)) {
    await connection.query(sql);
    console.log(`[DB] Table ${name} ready`);
  }

  // Create admin user if not exists
  const adminEmail = '2518119419@qq.com';
  const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (existing.length === 0) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    await connection.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'admin')",
      ['admin', adminEmail, hashedPassword]
    );
    console.log('[DB] Admin user created');
  }

  await connection.end();
  console.log('[DB] All tables initialized');
}

module.exports = initTables;
```

- [ ] **Step 3: 修改 server.js 第 48-51 行调用 auto-init**

```js
app.listen(port, async () => {
  console.log(`Server listening at http://localhost:${port}`);

  // Auto-init database tables on first run
  try {
    const initDB = require('./init_db_auto');
    await initDB();
  } catch (e) {
    console.warn('[DB] Init skip:', e.message);
  }
  // ... keep existing RSS code below
```

- [ ] **Step 4: 提交**

```bash
git add backend/init_db_auto.js backend/server.js
git commit -m "feat: auto-initialize database tables on server startup"
```

---

### Task 4: Zeabur 部署后端

- [ ] **Step 1: 推送代码到 GitHub**

确保所有改动已提交推送到 GitHub 仓库。

- [ ] **Step 2: Zeabur 导入项目**

1. 登录 zeabur.com → 用 GitHub 登录
2. New Project → Import from GitHub → 选择仓库
3. 项目检测到 Dockerfile → 自动识别为 Docker 服务

- [ ] **Step 3: 创建 MySQL 服务**

1. 在项目中 Add Service → MySQL
2. Zeabur 自动创建数据库并注入环境变量

- [ ] **Step 4: 配置环境变量**

在 Zeabur 后端服务 Settings → Environment Variables 中添加：

| 变量 | 值 |
|------|-----|
| PORT | 3000 |
| JWT_SECRET | `blog_jwt_secret_2026_` + 随机字符串 |
| SMTP_USER | 2518119419@qq.com |
| SMTP_PASS | hlncxxfmirrdecdf |

> MySQL 相关变量（MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE）由 Zeabur 自动注入，不需要手动设置。

- [ ] **Step 5: 部署**

点击 Deploy → 等待构建完成 → 获取后端域名（如 `xxx.zeabur.app`）

- [ ] **Step 6: 验证后端健康**

```bash
curl https://<zeabur域名>/api/health
# 预期：{"status":"ok","message":"Backend is running"}
```

---

### Task 5: Vercel 部署前端

- [ ] **Step 1: 更新 vercel.json 中的后端地址**

将 `<ZEABUR_BACKEND_URL>` 替换为 Zeabur 分配的实际域名：

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://<实际zeabur域名>/api/:path*"
    }
  ]
}
```

- [ ] **Step 2: 提交更新**

```bash
git add vercel.json
git commit -m "chore: update vercel backend URL"
git push
```

- [ ] **Step 3: Vercel 导入项目**

1. 登录 vercel.com → 用 GitHub 登录
2. New Project → Import from GitHub → 选择仓库
3. 自动识别 `vercel.json` → Deploy

- [ ] **Step 4: 验证前端**

浏览器访问 Vercel 分配的域名（如 `xxx.vercel.app`），确认博客正常加载。

---

### Task 6: 初始化数据库数据

- [ ] **Step 1: 导入豆瓣电影**

在 Zeabur Web Terminal 中执行：

```bash
cd /app && node -e "
const {fetchAllMovies, syncToDb} = require('./services/doubanService');
(async()=>{
  const movies = await fetchAllMovies();
  const result = await syncToDb(movies);
  console.log('Movies synced:', result);
  process.exit(0);
})();
"
```

- [ ] **Step 2: 导入照片数据（可选）**

照片服务自动从 Bing 搜索，无需手动导入。如需预填充，可执行：

```bash
cd /app && node -e "
const {searchBingImages} = require('./services/photoService');
const db = require('./config/db');
// ... 插入初始照片
"
```

- [ ] **Step 3: 最终验证**

访问 Vercel 域名，检查：
- 首页文章加载正常
- 电影板块显示豆瓣 Top250 数据
- 照片板块加载 Bing 搜索结果
- 注册/登录功能正常
- 邮件验证码发送正常
