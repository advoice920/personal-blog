# Remember Me 登录持久化 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现"记住我"功能——勾选则令牌存 localStorage（7天有效），不勾选则存 sessionStorage（1天有效），关标签页自动登出。

**Architecture:** 修改6个已有文件：后端1个（JWT动态有效期）、前端5个（API层、登录页、入口文件、路由守卫、导航栏）。数据流：Login.vue → api/index.js → 后端 authController → JWT → 前端存储分发。

**Tech Stack:** Vue 3 + Vue Router + Element Plus (前端), Node.js + Express + jsonwebtoken (后端)

---

### Task 1: 后端 — JWT 动态有效期

**Files:**
- Modify: `backend/controllers/authController.js:13,31`

- [ ] **Step 1: 修改 authController.login，根据 rememberMe 调整 JWT 过期时间**

将第 13 行解构和第 31 行 jwt.sign 改为：

```js
exports.login = async (req, res) => {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Username/Email and password are required' });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, email]);
    if (users.length === 0) {
      return res.status(401).json({ error: '账号或密码错误' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: '账号或密码错误' });
    }

    const expiresIn = rememberMe ? '7d' : '1d';
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn });
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

- [ ] **Step 2: 验证后端仍可正常启动**

```bash
cd backend && node -e "require('./controllers/authController'); console.log('OK')"
```

- [ ] **Step 3: 提交**

```bash
git add backend/controllers/authController.js
git commit -m "feat: JWT dynamic expiry based on rememberMe flag

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: 前端 API 层 — login() 增加 rememberMe 参数

**Files:**
- Modify: `frontend/src/api/index.js:1007-1011`

- [ ] **Step 1: 修改 login 函数签名和请求体**

```js
export const login = async (username, password, rememberMe = false) => {
  try {
    const baseUrl = API_BASE_URL || 'http://localhost:3000/api';
    const endpoint = '/auth/login';
    const response = await axios.post(`${baseUrl}${endpoint}`, { email: username, password, rememberMe });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    if (error.response && error.response.data) {
       return { code: error.response.status, msg: error.response.data.error || '登录失败' };
    }
    return { code: 500, msg: '网络错误，请确保后端服务已启动' };
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/api/index.js
git commit -m "feat: pass rememberMe flag from frontend login API

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: 前端 Login 页 — 接入 rememberMe 存储逻辑

**Files:**
- Modify: `frontend/src/views/Login/index.vue:94,104-105`

- [ ] **Step 1: 修改 handleLogin，传递 rememberMe 并根据其值选择存储**

将第 94 行 `login(...)` 调用改为传入 `rememberMe.value`，第 104-105 行改为动态选择 storage：

```js
const handleLogin = async () => {
  if (loading.value) return
  if (!form.username || !form.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  
  loading.value = true
  try {
    const res = await login(form.username.trim(), form.password.trim(), rememberMe.value)
    loading.value = false
    
    if (res.token) {
      ElMessage.success(res.user.role === 'admin' ? '欢迎回来，管理员！' : '登录成功')
      const storage = rememberMe.value ? localStorage : sessionStorage
      storage.setItem('token', res.token)
      storage.setItem('userInfo', JSON.stringify(res.user))
      router.push('/')
    } else if (res.code) {
      ElMessage.error(res.msg || '登录失败')
    } else {
      ElMessage.error('未知错误')
    }
  } catch (err) {
    loading.value = false
    ElMessage.error('网络异常')
  }
}
```

> 注意：模板中 `el-checkbox v-model="rememberMe"` 和 `const rememberMe = ref(false)` 已存在，无需修改。

- [ ] **Step 2: 提交**

```bash
git add frontend/src/views/Login/index.vue
git commit -m "feat: wire rememberMe checkbox to control token storage location

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: 前端 main.js — 移除强制清除令牌

**Files:**
- Modify: `frontend/src/main.js:10-13`

- [ ] **Step 1: 删除三行 localStorage.removeItem 及注释**

```js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import './styles/index.css'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { size: 'default' })

app.mount('#app')
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/main.js
git commit -m "fix: remove forced token clearing on startup — rememberMe handles persistence

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: 前端路由守卫 — 同时检查 localStorage 和 sessionStorage

**Files:**
- Modify: `frontend/src/router/index.js:96`

- [ ] **Step 1: 将 loggedIn 检查扩展到两个存储**

将第 96 行：

```js
const loggedIn = localStorage.getItem("token") || localStorage.getItem("mockToken")
```

改为：

```js
const loggedIn = localStorage.getItem("token")
  || sessionStorage.getItem("token")
  || localStorage.getItem("mockToken")
  || sessionStorage.getItem("mockToken")
```

- [ ] **Step 2: 提交**

```bash
git add frontend/src/router/index.js
git commit -m "feat: router guard checks both localStorage and sessionStorage for tokens

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: 前端 Navbar — 同步双存储检查和注销清理

**Files:**
- Modify: `frontend/src/components/layout/Navbar.vue:91-92,127-134`

- [ ] **Step 1: 修改 isLoggedIn 和 userInfo 的初始化逻辑**

将第 91-92 行：

```js
const isLoggedIn = ref(!!localStorage.getItem('token') || !!localStorage.getItem('mockToken'))
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
```

改为：

```js
const isLoggedIn = ref(
  !!localStorage.getItem('token') ||
  !!sessionStorage.getItem('token') ||
  !!localStorage.getItem('mockToken') ||
  !!sessionStorage.getItem('mockToken')
)
const userInfo = ref(
  JSON.parse(localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo') || '{}')
)
```

- [ ] **Step 2: 修改 handleLogout 同时清理两个 storage**

将第 127-134 行：

```js
const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('mockToken')
  localStorage.removeItem('userInfo')
  isLoggedIn.value = false
  userInfo.value = {}
  router.push('/login')
}
```

改为：

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

- [ ] **Step 3: 提交**

```bash
git add frontend/src/components/layout/Navbar.vue
git commit -m "feat: Navbar checks both storages and clears both on logout

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: 端到端验证

- [ ] **Step 1: 启动后端**

```bash
cd backend && node server.js
```

- [ ] **Step 2: 启动前端**

```bash
cd frontend && npm run dev
```

- [ ] **Step 3: 验证"记住我"场景**

1. 打开浏览器 → 应显示登录页
2. 勾选"记住我" → 用 `2518119419@qq.com` / `123456` 登录
3. 关闭标签页 → 新标签页打开 `http://localhost:5173`
4. 预期：**直接进入首页（保持登录）**

- [ ] **Step 4: 验证"不记住"场景**

1. 打开无痕窗口 → 不勾选"记住我" → 登录
2. 关闭标签页 → 新标签页打开
3. 预期：**退回登录页**

- [ ] **Step 5: 验证注销场景**

1. 登录 → 点击用户头像 → 点击"登出"
2. 预期：跳转登录页，刷新后仍停留在登录页
