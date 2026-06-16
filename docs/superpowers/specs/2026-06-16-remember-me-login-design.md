# Remember Me 登录持久化 — 设计文档

**日期：** 2026-06-16
**状态：** 待审批
**目标：** 实现 QQ 式登录体验 — 勾选"记住我"则持久登录，不勾选则关闭标签页后自动登出。

---

## 1. 需求摘要

- 登录页"记住我"复选框接入实际功能
- 勾选 → 令牌存 `localStorage`（持久），JWT 7 天有效
- 不勾选 → 令牌存 `sessionStorage`（会话级），JWT 1 天有效
- 关闭标签页/浏览器后，未勾选记住我的用户自动退出
- 手动注销时清空所有存储
- 移除之前在 `main.js` 中强制的令牌清除逻辑

---

## 2. 存储策略

```
登录成功 → rememberMe?
  ├── true  → localStorage  → 关浏览器不丢 → JWT 7d
  └── false → sessionStorage → 关标签页即丢 → JWT 1d
```

| 行为 | 勾选记住我 | 不勾选 |
|------|-----------|--------|
| 页面刷新 | 保持登录 | 保持登录 |
| 关闭标签页重开 | 保持登录 | 需重新登录 |
| 关闭浏览器重开 | 保持登录 | 需重新登录 |
| 手动注销 | 清两个 storage | 清两个 storage |

---

## 3. 文件改动清单

### 3.1 `frontend/src/main.js` — 还原强制清除

**改动：** 删除之前添加的三行 `localStorage.removeItem(...)`。
**原因：** 强制清除与持久登录矛盾。

```diff
- // 每次前端启动清除登录态，确保从登录页开始
- localStorage.removeItem('token')
- localStorage.removeItem('mockToken')
- localStorage.removeItem('userInfo')
-
  const app = createApp(App)
```

### 3.2 `frontend/src/api/index.js` — login() 增加 rememberMe 参数

**改动：** `login(username, password)` → `login(username, password, rememberMe = false)`，请求体增加 `rememberMe` 字段。

```js
export const login = async (username, password, rememberMe = false) => {
  try {
    const baseUrl = API_BASE_URL || 'http://localhost:3000/api';
    const endpoint = '/auth/login';
    const response = await axios.post(`${baseUrl}${endpoint}`, {
      email: username,
      password,
      rememberMe
    });
    return response.data;
  } catch (error) {
    // ... 错误处理不变
  }
}
```

### 3.3 `frontend/src/views/Login/index.vue` — 核心逻辑

**改动 1：** `handleLogin` 中调用 `login()` 时传入 `rememberMe.value`。

**改动 2：** 登录成功后，根据 `rememberMe.value` 选择存储目标：

```js
const storage = rememberMe.value ? localStorage : sessionStorage
storage.setItem('token', res.token)
storage.setItem('userInfo', JSON.stringify(res.user))
```

> 注意：`mockToken` 不走此流程，因为它是测试用的，始终用 localStorage。

### 3.4 `frontend/src/router/index.js` — beforeEach 守卫

**改动：** `loggedIn` 检查扩展为同时检查 localStorage 和 sessionStorage：

```js
const loggedIn = localStorage.getItem("token")
  || sessionStorage.getItem("token")
  || localStorage.getItem("mockToken")
  || sessionStorage.getItem("mockToken")
```

### 3.5 `frontend/src/components/layout/Navbar.vue` — 导航栏

**改动 1：** `isLoggedIn` 同时检查两个 storage：

```js
const isLoggedIn = ref(
  !!localStorage.getItem('token') ||
  !!sessionStorage.getItem('token') ||
  !!localStorage.getItem('mockToken') ||
  !!sessionStorage.getItem('mockToken')
)
```

**改动 2：** `handleLogout` 同时清理两个 storage：

```js
const handleLogout = () => {
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
  localStorage.removeItem('mockToken')
  sessionStorage.removeItem('mockToken')
  localStorage.removeItem('userInfo')
  sessionStorage.removeItem('userInfo')
  isLoggedIn.value = false
  userInfo.value = {}
  router.push('/login')
}
```

**改动 3：** `userInfo` 加载逻辑，优先 localStorage 再 sessionStorage：

```js
const userInfo = ref(
  JSON.parse(localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo') || '{}')
)
```

### 3.6 `backend/controllers/authController.js` — JWT 动态有效期

**改动：** 根据 `rememberMe` 参数调整 token 过期时间：

```js
exports.login = async (req, res) => {
  const { email, password, rememberMe } = req.body;
  // ... 验证逻辑不变 ...
  
  const expiresIn = rememberMe ? '7d' : '1d';
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn });
  
  res.json({
    message: 'Login successful',
    token,
    user: { id: user.id, email: user.email, role: user.role }
  });
};
```

---

## 4. 边界情况

| 场景 | 处理方式 |
|------|---------|
| 两个 storage 都有 token | 守卫和导航栏用 `\|\|` 取第一个有效值，两个同时存在不影响 |
| 用户手动清除浏览器数据 | 两个 storage 都被清除，退回登录页（现有守卫已覆盖） |
| JWT 过期但仍未注销 | API 请求失败 → 返回 401 → 此处不做全局拦截（后续可加） |
| 旧版本残留的 localStorage token | 无影响，两个 storage 只要有 token 就认为已登录 |

---

## 5. 不做的

- Refresh token 机制（过度设计）
- 多设备踢下线（个人博客不需要）
- 全局 401 拦截自动跳转登录（后续可加）
- Phone/SMS 登录（用户只要求邮箱）

---

## 6. 测试要点

1. 勾选"记住我" → 登录 → 关闭标签页 → 新标签页打开 → 应保持登录
2. 不勾选"记住我" → 登录 → 关闭标签页 → 新标签页打开 → 应退回登录页
3. 任意模式 → 刷新页面 → 应保持登录
4. 点击注销 → 应清空登录态并跳转登录页
5. 注册 → 登录 → 默认不勾选 → 关闭标签页 → 应退回登录页
