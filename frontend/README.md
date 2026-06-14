# LiveBlog - 个人生活博客

Vue 3 + Vite + Element Plus

## 启动

```bash
npm install
npm run dev
```

## API 需求（后续对接）

```
GET    /api/articles?category=&page=&pageSize=   # 文章列表
GET    /api/articles/:id                         # 文章详情
POST   /api/articles                             # 发布文章
GET    /api/ranking                              # 热度排行榜
GET    /api/user/notifications                   # 通知
GET    /api/user/history                         # 浏览历史
GET    /api/user/favorites                       # 收藏
GET    /api/user/following                       # 关注
POST   /api/user/follow/:id                      # 关注作者
```
