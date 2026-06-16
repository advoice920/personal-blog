<template>
  <div class="login-container">
    <div class="login-glass-panel">
      <!-- Decoration Elements -->
      <div class="glass-orb orb-1"></div>
      <div class="glass-orb orb-2"></div>
      
      <!-- Content -->
      <div class="login-content">
        <div class="logo-area">
          <h1 class="logo-text">LiveBlog</h1>
          <p class="subtitle">欢迎回到您的个人宇宙</p>
        </div>

        <div class="form-area">
          <div class="input-group">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名或邮箱"
              class="glass-input"
              size="large"
              autocomplete="new-password"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </div>

          <div class="input-group">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              class="glass-input"
              size="large"
              show-password
              autocomplete="new-password"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </div>
          
          <div class="action-row">
            <el-checkbox v-model="rememberMe" class="glass-checkbox">记住我</el-checkbox>
            <router-link to="/forgot-password" class="forgot-link">忘记密码？</router-link>
          </div>

          <button 
            class="glow-login-btn" 
            :class="{ 'is-loading': loading }" 
            @click="handleLogin"
          >
            <span v-if="!loading">登 录</span>
            <el-icon v-else class="is-loading-icon"><Loading /></el-icon>
          </button>
        </div>
        
        <div class="login-footer">
          还没有账号？ <router-link to="/register">立即注册</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Message, Key, Loading } from '@element-plus/icons-vue'
import { login } from '@/api/index'
import { ElMessage } from 'element-plus'

const router = useRouter()
const rememberMe = ref(false)
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const handleLogin = async () => {
  if (loading.value) return
  if (!form.username || !form.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  
  loading.value = true
  try {
    const res = await login(form.username.trim(), form.password.trim())
    loading.value = false
    
    // API directly returns JSON { message, token, user } on success, or throws on failure.
    // However, our wrapper catches it and returns { code: ..., msg: ... } on failure.
    // Wait, the original login wrapper expects res to have { code: 200 }? 
    // In our api index, we return response.data for success. response.data has { message, token, user }.
    // Let's adapt to that:
    if (res.token) {
      ElMessage.success(res.user.role === 'admin' ? '欢迎回来，管理员！' : '登录成功')
      localStorage.setItem('token', res.token)
      localStorage.setItem('userInfo', JSON.stringify(res.user))
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
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
}

.login-glass-panel {
  position: relative;
  width: 420px;
  padding: 40px 40px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  z-index: 10;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

/* Floating Light Orbs */
.glass-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  z-index: -1;
  opacity: 0.6;
}
.orb-1 {
  width: 150px;
  height: 150px;
  background: #fc3c44;
  top: -40px;
  right: -40px;
  animation: pulse 8s infinite alternate;
}
.orb-2 {
  width: 200px;
  height: 200px;
  background: #4facfe;
  bottom: -60px;
  left: -60px;
  animation: pulse 10s infinite alternate-reverse;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(1.2); opacity: 0.8; }
}

.login-content {
  position: relative;
  z-index: 1;
}

.logo-area {
  text-align: center;
  margin-bottom: 25px;
}

.logo-text {
  font-size: 36px;
  font-weight: 800;
  color: #fff;
  margin: 0;
  letter-spacing: 2px;
  text-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 5px;
}

/* Login Tabs */
.login-tabs {
  position: relative;
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  margin-bottom: 25px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  position: relative;
  z-index: 2;
  transition: color 0.3s;
}

.tab-item.active {
  color: #fff;
  font-weight: bold;
}

.tab-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  transition: left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 1;
}

.form-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 200px; /* stabilize height during transitions */
}

.input-group {
  position: relative;
}

.code-group {
  display: flex;
  gap: 12px;
}

.code-group .glass-input {
  flex: 1;
}

.get-code-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  border-radius: 16px;
  padding: 0 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.get-code-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
  color: #fff;
}

.get-code-btn:disabled {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.4);
  cursor: not-allowed;
  border-color: rgba(255, 255, 255, 0.1);
}

.glass-input :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.15);
  box-shadow: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 8px 16px;
  transition: all 0.3s;
}

.glass-input :deep(.el-input__wrapper:hover) {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
}

.glass-input :deep(.el-input__wrapper.is-focus) {
  background: rgba(255, 255, 255, 0.3);
  border-color: #fc3c44;
  box-shadow: 0 0 15px rgba(252, 60, 68, 0.3);
}

.glass-input :deep(.el-input__inner) {
  color: #fff;
  font-size: 15px;
}
.glass-input :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.6);
}
.glass-input :deep(.el-icon) {
  color: #fff;
  font-size: 18px;
}

.action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: -10px;
}

.glass-checkbox :deep(.el-checkbox__label) {
  color: rgba(255, 255, 255, 0.8);
}
.glass-checkbox :deep(.el-checkbox__inner) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}
.glass-checkbox.is-checked :deep(.el-checkbox__inner) {
  background: #fc3c44;
  border-color: #fc3c44;
}
.glass-checkbox.is-checked :deep(.el-checkbox__label) {
  color: #fff;
}

.forgot-link {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  text-decoration: none;
  transition: color 0.3s;
}
.forgot-link:hover {
  color: #fff;
  text-decoration: underline;
}

.glow-login-btn {
  width: 100%;
  padding: 14px;
  border-radius: 20px;
  border: none;
  background: linear-gradient(135deg, #fc3c44, #ff2d55);
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(252, 60, 68, 0.4);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  margin-top: 5px;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 52px;
}

.glow-login-btn::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 50%; height: 100%;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent);
  transform: skewX(-20deg);
  transition: 0.5s;
}

.glow-login-btn:hover:not(.is-loading) {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 25px rgba(252, 60, 68, 0.6);
}

.glow-login-btn:hover:not(.is-loading)::before {
  left: 150%;
}

.glow-login-btn.is-loading {
  cursor: not-allowed;
  opacity: 0.9;
  transform: scale(0.98);
}

.is-loading-icon {
  font-size: 24px;
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.login-footer {
  margin-top: 25px;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.login-footer a {
  color: #fff;
  font-weight: bold;
  text-decoration: none;
  margin-left: 5px;
}

.login-footer a:hover {
  text-decoration: underline;
}

/* Fix for browser autofill breaking glass effect */
.glass-input :deep(input:-webkit-autofill),
.glass-input :deep(input:-webkit-autofill:hover),
.glass-input :deep(input:-webkit-autofill:focus),
.glass-input :deep(input:-webkit-autofill:active) {
  -webkit-transition-delay: 99999s;
  -webkit-text-fill-color: #fff !important;
}
</style>
