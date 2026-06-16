import { createRouter, createWebHistory } from "vue-router"

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/Login/index.vue"),
    meta: { title: "登录" },
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("@/views/Register/index.vue"),
    meta: { title: "注册" },
  },
  {
    path: "/forgot-password",
    name: "ForgotPassword",
    component: () => import("@/views/ForgotPassword/index.vue"),
    meta: { title: "找回密码" },
  },
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/Home/index.vue"),
    meta: { title: "首页" },
  },
  {
    path: "/post/:id",
    name: "PostDetail",
    component: () => import("@/views/PostDetail/index.vue"),
    meta: { title: "文章详情" },
  },
  {
    path: "/editor",
    name: "Editor",
    component: () => import("@/views/Editor/index.vue"),
    meta: { title: "创作中心", requiresAuth: true },
  },
  {
    path: "/playlist/:id",
    name: "PlaylistDetail",
    component: () => import("@/views/PlaylistDetail/index.vue"),
    meta: { title: "歌单详情" },
  },
  {
    path: "/profile/:id?",
    name: "Profile",
    component: () => import("@/views/Profile/index.vue"),
    meta: { title: "个人中心" },
  },
  {
    path: "/notifications",
    name: "Notifications",
    component: () => import("@/views/Notifications/index.vue"),
    meta: { title: "通知" },
  },
  {
    path: "/history",
    name: "History",
    component: () => import("@/views/History/index.vue"),
    meta: { title: "历史" },
  },
  {
    path: "/favorites",
    name: "Favorites",
    component: () => import("@/views/Favorites/index.vue"),
    meta: { title: "收藏" },
  },
  {
    path: "/following",
    name: "Following",
    component: () => import("@/views/Following/index.vue"),
    meta: { title: "关注" },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } },
})

router.beforeEach((to, from, next) => {
  console.log("[Router] navigating to:", to.path, "from:", from.path)

  if (to.meta.title) {
    document.title = to.meta.title + " - LiveBlog"
  } else {
    document.title = "LiveBlog"
  }

  const publicPages = ["/login", "/register", "/forgot-password"]
  const publicPrefixes = ["/post/", "/playlist/", "/profile/"]
  const isPublicPath = publicPages.includes(to.path) || publicPrefixes.some(p => to.path.startsWith(p))
  const loggedIn = localStorage.getItem("token") || localStorage.getItem("mockToken")

  console.log("[Router] isPublicPath:", isPublicPath, "loggedIn:", !!loggedIn)

  if (!isPublicPath && !loggedIn) {
    console.log("[Router] redirecting to /login")
    return next("/login")
  }

  next()
})

export default router
