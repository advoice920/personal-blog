# LiveBlog - 个人博客系统

全栈个人博客，前后端分离架构。

## 功能

- 📝 文章发布与编辑（Markdown 支持）
- 🎵 音乐搜索与播放（对接网易云音乐）
- 📰 RSS 聚合阅读（36氪 / 少数派 / 阮一峰）
- 🔐 登录/注册/找回密码（邮箱验证码）
- 📚 美食/旅行/读书/穿搭/运动/摄影 多板块
- 🎨 玻璃拟态 UI 设计

## 技术栈

| 层 | 技术 |
|------|------|
| 前端 | Vue 3 + Element Plus + Pinia |
| 后端 | Express + MySQL/SQLite |
| 音乐 | NeteaseCloudMusicApi |

## 快速开始

```bash
# 1. 克隆
git clone https://gitee.com/advoice/personal-blog.git
cd personal-blog

# 2. 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 3. 配置环境变量（可选，不配则用 SQLite）
cp backend/.env.example backend/.env
# 如需 MySQL，编辑 backend/.env 填入数据库密码

# 4. 启动
cd backend && npm run dev    # 后端 → http://localhost:3000
cd frontend && npm run dev   # 前端 → http://localhost:5173
```

## 数据库

- **有 MySQL**：在 `.env` 里配好密码，自动连 MySQL
- **没 MySQL**：自动使用 `frontend/public/mock.sqlite`，零配置直接跑

管理员账号：`2518119419@qq.com` / `Qazwsx123`

## 推 Gitee 前

```bash
node export_sqlite.js   # 导出 MySQL → SQLite
git add . && git commit && git push
```
