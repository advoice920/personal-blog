# 博客项目部署 — 设计文档

**日期：** 2026-06-16
**状态：** 已确认
**方案：** Vercel (前端) + Zeabur (后端+MySQL)

---

## 1. 架构

```
用户浏览器
    │
    ├── 前端静态文件 (Vercel) — 全球 CDN
    │   └── Vue 3 SPA, vite build → dist/
    │   └── /api/* 请求转发至 Zeabur
    │
    └── 后端 API (Zeabur) — Node.js + Express
        ├── 业务接口 /api/movie, /api/articles, /api/photos ...
        ├── 认证 /api/auth/login, /api/auth/register
        ├── 图片代理 /api/img
        ├── RSS 抓取 /api/rss
        └── MySQL (Zeabur 托管)
```

---

## 2. 前端部署 (Vercel)

### 2.1 vercel.json（项目根目录）

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://<zeabur域名>/api/:path*" }
  ],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/[^.]+", "dest": "/index.html" }
  ]
}
```

### 2.2 前端环境变量

`VITE_API_BASE_URL` 不需要设置 — API 请求走相对路径 `/api/*`，Vercel rewrites 转发到 Zeabur。

---

## 3. 后端部署 (Zeabur)

### 3.1 Dockerfile（项目根目录）

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
EXPOSE 3000
CMD ["node", "server.js"]
```

### 3.2 Zeabur 服务配置

- 服务类型：Docker
- 端口：3000
- MySQL 数据库：Zeabur 自动创建，环境变量自动注入

### 3.3 环境变量（注入到 Zeabur，不写在代码里）

| 变量 | 说明 | 来源 |
|------|------|------|
| PORT | 3000 | 手动设置 |
| MYSQL_HOST | MySQL 地址 | Zeabur 自动 |
| MYSQL_USER | MySQL 用户 | Zeabur 自动 |
| MYSQL_PASSWORD | MySQL 密码 | Zeabur 自动 |
| MYSQL_DATABASE | bloger_db | Zeabur 自动 |
| JWT_SECRET | 随机字符串 | 手动生成 |
| SMTP_USER | QQ邮箱 | 手动设置 |
| SMTP_PASS | QQ邮箱授权码 | 手动设置 |

### 3.4 数据库初始化

Zeabur 首次启动后，SSH 进入容器手动执行：

```bash
node backend/init_db.js
```

或改造为 `server.js` 启动时自动建表（幂等 `CREATE TABLE IF NOT EXISTS`）。

---

## 4. 改造清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `vercel.json` | 新建 | Vercel 构建和路由配置 |
| `Dockerfile` | 新建 | 后端容器化 |
| `backend/init_db.js` | 检查 | 确认表定义包含 `movie`/`photo` 等 |
| `backend/server.js` | 检查 | 启动时是否自动初始化数据库 |
| `backend/.env` | 拆分 | 敏感值移到 Zeabur 环境变量 |
| `frontend/src/api/index.js` | 检查 | API 调用用相对路径 |

---

## 5. 部署步骤

1. 注册 Zeabur (zeabur.com) + Vercel (vercel.com)
2. GitHub 推送代码
3. Zeabur 导入项目 → 创建 MySQL 服务 → 部署后端
4. 获取 Zeabur 后端域名
5. 更新 `vercel.json` 中的 rewrite destination
6. Vercel 导入项目 → 部署前端
7. 初始化数据库：`node init_db.js`
8. 验证上线
