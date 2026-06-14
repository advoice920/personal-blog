<template>
  <div class="creator-layout">
    <header class="creator-topbar">
      <div class="topbar-left">
        <router-link to="/" class="back-btn">
          <el-icon><ArrowLeft /></el-icon> 返回首页
        </router-link>
        <div class="topbar-title">创作中心</div>
      </div>
      
      <div class="topbar-center">
        <el-radio-group v-model="activeCat" size="large" class="category-selector">
          <el-radio-button label="article">📝 文章</el-radio-button>
          <el-radio-button label="food">🥘 美食</el-radio-button>
          <el-radio-button label="travel">✈️ 旅行</el-radio-button>
          <el-radio-button label="reading">📚 读书</el-radio-button>
          <el-radio-button label="fashion">👗 穿搭</el-radio-button>
          <el-radio-button label="sports">🚴‍♂️ 运动</el-radio-button>
          <el-radio-button label="photo">📷 摄影</el-radio-button>
        </el-radio-group>
      </div>

      <div class="topbar-right">
        <el-button @click="resetForm" plain>重置</el-button>
        <el-button type="primary" :icon="Promotion" color="#111" @click="publish">立即发布</el-button>
      </div>
    </header>

    <main class="creator-body">
      <div class="workspace-wrapper">
        <div class="form-container">
          <!-- Common Title & Cover -->
        <div class="form-section common-section">
          <el-input 
            v-model="form.title" 
            placeholder="为你的作品起一个响亮的标题..." 
            class="mega-title-input" 
          />
          
          <div class="upload-wrapper" style="margin-top: 30px;">
            <label class="section-label">设置封面图</label>
            <el-upload
              class="cover-uploader"
              action="#"
              :show-file-list="false"
              :auto-upload="false"
              :on-change="(file) => handleImageUpload(file, 'cover')"
              accept="image/*"
            >
              <div v-if="form.cover" class="cover-preview">
                <img :src="form.cover" alt="Cover Preview" />
                <div class="cover-hover-layer"><el-icon><Edit /></el-icon> 更换图片</div>
              </div>
              <div v-else class="upload-placeholder">
                <el-icon class="upload-icon"><Plus /></el-icon>
                <div class="el-upload__text">点击上传本地图片 <em>(或者拖拽到此处)</em></div>
              </div>
            </el-upload>
          </div>
        </div>

        <!-- Article Form -->
        <div v-if="activeCat === 'article'" class="form-section specific-section">
          <h3>📝 文章写作</h3>
          <div class="inline-fields">
            <div class="field"><label>文章分类</label>
              <el-select v-model="form.article.category" placeholder="选择分类">
                <el-option label="科技" value="科技" />
                <el-option label="商业" value="商业" />
                <el-option label="生活" value="生活" />
                <el-option label="阅读" value="阅读" />
                <el-option label="数码" value="数码" />
                <el-option label="其他" value="其他" />
              </el-select>
            </div>
            <div class="field"><label>标签（逗号分隔）</label>
              <el-input v-model="form.article.tags" placeholder="e.g. AI, 前端, 开源" />
            </div>
          </div>

          <div class="field" style="margin-top: 16px">
            <label>摘要</label>
            <el-input v-model="form.article.summary" type="textarea" :rows="2" placeholder="简短描述文章内容..." />
          </div>

          <div class="field" style="margin-top: 24px">
            <label>正文内容（支持 Markdown）</label>
            <el-input v-model="form.article.content" type="textarea" :rows="15" placeholder="在这里写作... 支持 Markdown 语法" />
          </div>
        </div>

        <!-- Food Form -->
        <div v-if="activeCat === 'food'" class="form-section specific-section">
          <h3>🍔 美食档案</h3>
          <div class="inline-fields">
            <div class="field"><label>评分</label><el-rate v-model="form.food.rating" /></div>
            <div class="field"><label>准备时间</label><el-input v-model="form.food.prepTime" placeholder="e.g. 15 mins" /></div>
            <div class="field"><label>烹饪时间</label><el-input v-model="form.food.cookTime" placeholder="e.g. 30 mins" /></div>
          </div>
          
          <div class="dynamic-list">
            <h4>食材清单 (Ingredients)</h4>
            <div v-for="(item, index) in form.food.ingredients" :key="'ing'+index" class="list-row">
              <el-input v-model="item.name" placeholder="食材名称 (e.g. 牛肉)" style="flex: 2" />
              <el-input v-model="item.amount" placeholder="用量 (e.g. 500g)" style="flex: 1" />
              <el-button type="danger" plain circle :icon="Delete" @click="form.food.ingredients.splice(index, 1)" />
            </div>
            <el-button class="add-btn" @click="form.food.ingredients.push({name: '', amount: ''})">+ 添加食材</el-button>
          </div>

          <div class="dynamic-list">
            <h4>制作步骤 (Instructions)</h4>
            <div v-for="(item, index) in form.food.instructions" :key="'step'+index" class="list-row">
              <span class="step-num">{{ index + 1 }}</span>
              <el-input v-model="item.desc" type="textarea" :rows="2" placeholder="描述制作步骤..." style="flex: 1" />
              <el-button type="danger" plain circle :icon="Delete" @click="form.food.instructions.splice(index, 1)" />
            </div>
            <el-button class="add-btn" @click="form.food.instructions.push({desc: ''})">+ 添加步骤</el-button>
          </div>
        </div>

        <!-- Travel Form -->
        <div v-if="activeCat === 'travel'" class="form-section specific-section">
          <h3>✈️ 行程计划</h3>
          <div class="inline-fields">
            <div class="field"><label>目的地</label><el-input v-model="form.travel.location" placeholder="e.g. 日本·京都" /></div>
          </div>
          
          <div class="dynamic-list">
            <h4>每日行程 (Timeline)</h4>
            <div v-for="(item, index) in form.travel.days" :key="'day'+index" class="list-row timeline-row">
              <el-input v-model="item.day" placeholder="Day 1" style="width: 100px" />
              <el-input v-model="item.description" type="textarea" :rows="2" placeholder="描述当天的行程..." style="flex: 1" />
              <el-button type="danger" plain circle :icon="Delete" @click="form.travel.days.splice(index, 1)" />
            </div>
            <el-button class="add-btn" @click="form.travel.days.push({day: '', description: ''})">+ 添加一天行程</el-button>
          </div>

          <div class="field" style="margin-top: 30px">
            <label>旅行 Tips (防坑指南)</label>
            <el-input v-model="form.travel.tips" type="textarea" :rows="3" placeholder="写下你的避坑建议..." />
          </div>
        </div>

        <!-- Reading Form -->
        <div v-if="activeCat === 'reading'" class="form-section specific-section">
          <h3>📚 读书笔记</h3>
          <div class="inline-fields">
            <div class="field"><label>作者</label><el-input v-model="form.reading.author" placeholder="作者名" /></div>
            <div class="field"><label>评分 (10分制)</label><el-input-number v-model="form.reading.rating" :min="1" :max="10" :step="0.1" /></div>
          </div>
          
          <div class="field">
            <label>内容简介</label>
            <el-input v-model="form.reading.summary" type="textarea" :rows="2" placeholder="这本书讲了什么..." />
          </div>

          <div class="field">
            <label>金句摘录</label>
            <el-input v-model="form.reading.quote" type="textarea" :rows="2" placeholder="最打动你的一句话..." />
          </div>

          <div class="field">
            <label>深度书评</label>
            <el-input v-model="form.reading.review" type="textarea" :rows="5" placeholder="写下你的思考与共鸣..." />
          </div>
        </div>

        <!-- Fashion Form -->
        <div v-if="activeCat === 'fashion'" class="form-section specific-section">
          <h3>👗 穿搭 Lookbook</h3>
          <div class="inline-fields">
            <div class="field"><label>品牌</label><el-input v-model="form.fashion.brand" placeholder="e.g. CHANEL" /></div>
            <div class="field"><label>设计师</label><el-input v-model="form.fashion.designer" placeholder="e.g. Virginie Viard" /></div>
            <div class="field"><label>系列</label><el-input v-model="form.fashion.collection" placeholder="e.g. SS 2026" /></div>
          </div>
          
          <div class="field">
            <label>时尚编辑点评</label>
            <el-input v-model="form.fashion.detailedReview" type="textarea" :rows="4" placeholder="点评这套穿搭的设计语言..." />
          </div>

          <div class="dynamic-list">
            <h4>Lookbook 海报组 (本地上传)</h4>
            <div class="lookbook-grid">
              <div v-for="(img, index) in form.fashion.lookbook" :key="'look'+index" class="look-img-box">
                <img v-if="img" :src="img" />
                <el-button type="danger" circle :icon="Delete" class="del-img-btn" @click="form.fashion.lookbook.splice(index, 1)" />
              </div>
              
              <el-upload
                class="lookbook-uploader"
                action="#"
                :show-file-list="false"
                :auto-upload="false"
                :on-change="(file) => handleImageUpload(file, 'lookbook')"
                accept="image/*"
              >
                <div class="upload-placeholder lookbook-placeholder">
                  <el-icon><Plus /></el-icon>
                </div>
              </el-upload>
            </div>
          </div>
        </div>

        <!-- Sports Form -->
        <div v-if="activeCat === 'sports'" class="form-section specific-section">
          <h3>🚴‍♂️ 运动拉练</h3>
          <div class="inline-fields">
            <div class="field"><label>类型</label>
              <el-select v-model="form.sports.type" placeholder="运动类型">
                <el-option label="Running" value="Running" />
                <el-option label="Cycling" value="Cycling" />
                <el-option label="Swimming" value="Swimming" />
                <el-option label="Workout" value="Workout" />
              </el-select>
            </div>
            <div class="field"><label>日期</label><el-input v-model="form.sports.date" placeholder="e.g. Today" /></div>
            <div class="field"><label>距离</label><el-input v-model="form.sports.distance" placeholder="e.g. 10.2 km" /></div>
            <div class="field"><label>配速</label><el-input v-model="form.sports.pace" placeholder="e.g. 5:30 /km" /></div>
            <div class="field"><label>心率</label><el-input v-model="form.sports.hr" placeholder="e.g. 145 bpm" /></div>
            <div class="field"><label>爬升</label><el-input v-model="form.sports.elevation" placeholder="e.g. 120 m" /></div>
            <div class="field"><label>消耗</label><el-input v-model="form.sports.calories" placeholder="e.g. 650 kcal" /></div>
          </div>
          
          <div class="field">
            <label>运动日记</label>
            <el-input v-model="form.sports.description" type="textarea" :rows="3" placeholder="记录今天的运动感受..." />
          </div>

          <div class="dynamic-list">
            <h4>分段配速记录 (Splits)</h4>
            <div v-for="(split, index) in form.sports.splits" :key="'split'+index" class="list-row">
              <el-input v-model="split.km" placeholder="段落 (e.g. 1 或者 0-20)" style="width: 120px" />
              <el-input v-model="split.pace" placeholder="配速" style="width: 120px" />
              <el-button type="danger" plain circle :icon="Delete" @click="form.sports.splits.splice(index, 1)" />
            </div>
            <el-button class="add-btn" @click="form.sports.splits.push({km: '', pace: ''})">+ 添加分段数据</el-button>
          </div>
        </div>

        <!-- Photo Form -->
        <div v-if="activeCat === 'photo'" class="form-section specific-section">
          <h3>📷 摄影作品</h3>
          <div class="inline-fields">
            <div class="field"><label>摄影师 (作者)</label><el-input v-model="form.photo.author" placeholder="你的名字" /></div>
            <div class="field"><label>作品分类</label>
              <el-select v-model="form.photo.category" placeholder="分类">
                <el-option label="自然风光" value="自然风光" />
                <el-option label="城市建筑" value="建筑" />
                <el-option label="人像摄影" value="肖像" />
                <el-option label="街头纪实" value="人文纪实" />
                <el-option label="极简抽象" value="极简抽象" />
                <el-option label="黑白摄影" value="黑白" />
              </el-select>
            </div>
          </div>
          <p style="color: #888; font-size: 13px; margin-top: 20px;">
            提示：上方设置的“封面图”即为你的摄影作品主体。作品将在“摄影”频道的瀑布流中高清展示！
          </p>
        </div>

        </div>

        <!-- AI Assistant Sidebar -->
        <aside class="ai-assistant-sidebar">
          <div class="ai-header">
            <el-icon class="ai-icon"><MagicStick /></el-icon>
            <span>AI 创作助手</span>
          </div>
          
          <div class="ai-tools">
            <div class="ai-tool-card" @click="generateTitle">
              <div class="tool-icon bg-orange">💡</div>
              <div class="tool-info">
                <h4>灵感爆棚</h4>
                <p>一键生成爆款标题与摘要</p>
              </div>
            </div>
            
            <div class="ai-tool-card" @click="polishText">
              <div class="tool-icon bg-blue">✨</div>
              <div class="tool-info">
                <h4>文案润色</h4>
                <p>让文字更具网感和情绪价值</p>
              </div>
            </div>

            <div class="ai-tool-card" @click="suggestTags">
              <div class="tool-icon bg-green">🏷️</div>
              <div class="tool-info">
                <h4>智能打标</h4>
                <p>自动提取热门话题与标签</p>
              </div>
            </div>
            
            <div class="ai-chat-box">
              <div class="chat-placeholder">
                <el-icon><ChatDotRound /></el-icon>
                <p>有任何写作困难，随时问我...</p>
              </div>
                <el-input 
                v-model="aiPrompt" 
                placeholder="例如：帮我写一段探店的开场白..." 
                class="ai-input glass-input"
                @keyup.enter="handleAiChat"
              >
                <template #append>
                  <el-button :icon="Promotion" @click="handleAiChat" />
                </template>
              </el-input>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Promotion, Picture, Delete, Plus, Edit, MagicStick, ChatDotRound } from '@element-plus/icons-vue'
import axios from 'axios'
import { uploadImage, chatWithAI } from '@/api/index.js'

const aiPrompt = ref('')

// Mock data imports removed. In a real app, you would submit to an API here.

const router = useRouter()
const activeCat = ref('article')

const defaultForm = () => ({
  title: '',
  cover: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80',
  food: {
    rating: 5, prepTime: '15 mins', cookTime: '30 mins',
    ingredients: [{ name: '', amount: '' }],
    instructions: [{ desc: '' }]
  },
  travel: {
    location: '', tips: '',
    days: [{ day: 'Day 1', description: '' }]
  },
  reading: {
    author: '', rating: 9.0, summary: '', quote: '', review: ''
  },
  fashion: {
    brand: '', designer: '', collection: '', detailedReview: '',
    lookbook: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80']
  },
  sports: {
    type: 'Running', distance: '', pace: '', hr: '', date: 'Today', elevation: '', calories: '', description: '',
    splits: [{ km: '1', pace: '' }]
  },
  photo: {
    author: 'Admin', category: '自然风光'
  },
  article: {
    category: '科技', tags: '', summary: '', content: ''
  }
})

const form = reactive(defaultForm())

const resetForm = () => {
  Object.assign(form, defaultForm())
  ElMessage.info('表单已重置')
}

// 处理本地图片上传到服务器
const handleImageUpload = async (uploadFile, target) => {
  const file = uploadFile.raw
  if (!file) return

  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    return ElMessage.error('只能上传图片文件!')
  }

  try {
    ElMessage.info('图片上传中...')
    const res = await uploadImage(file)
    if (res.code === 200) {
      const imageUrl = res.data.url
      if (target === 'cover') {
        form.cover = imageUrl
      } else if (target === 'lookbook') {
        if (form.fashion.lookbook.length === 1 && form.fashion.lookbook[0] === '') {
          form.fashion.lookbook = [imageUrl]
        } else {
          form.fashion.lookbook.push(imageUrl)
        }
      }
      ElMessage.success('上传成功')
    } else {
      ElMessage.error(res.message || '上传失败')
    }
  } catch (error) {
    console.error('Upload Error:', error)
    // Fallback to base64 if API fails
    const reader = new FileReader()
    reader.onload = (e) => {
      if (target === 'cover') {
        form.cover = e.target.result
      } else if (target === 'lookbook') {
        if (form.fashion.lookbook.length === 1 && form.fashion.lookbook[0] === '') {
          form.fashion.lookbook = [e.target.result]
        } else {
          form.fashion.lookbook.push(e.target.result)
        }
      }
    }
    reader.readAsDataURL(file)
    ElMessage.warning('API 上传失败，已自动转为本地预览（Base64）')
  }
}

const generateTitle = async () => {
  ElMessage.success('✨ 正在使用 AI 分析当前素材...')
  const prompt = `根据以下内容生成 3 个吸引人的爆款标题（用【1】【2】【3】标识）和一段摘要。内容：\n${JSON.stringify(form[activeCat.value]).substring(0, 2000)}`;
  const reply = await chatWithAI([{ role: 'user', content: prompt }], '你是一个爆款内容运营专家。');
  if (reply) {
    ElMessageBox.alert(reply.replace(/\n/g, '<br/>'), '生成的标题与摘要', { dangerouslyUseHTMLString: true });
  } else {
    ElMessage.error('AI 响应失败');
  }
}

const polishText = async () => {
  ElMessage.info('正在润色文案，让语言更具感染力...')
  let textField = '';
  if (activeCat.value === 'travel') textField = 'tips';
  else if (activeCat.value === 'reading') textField = 'review';
  else if (activeCat.value === 'fashion') textField = 'detailedReview';
  else if (activeCat.value === 'sports') textField = 'description';
  else if (activeCat.value === 'food') return ElMessage.warning('美食记录当前结构不支持长文润色');
  else if (activeCat.value === 'photo') return ElMessage.warning('摄影内容主要为图片，无需润色');
  
  const text = form[activeCat.value][textField];
  if (!text) return ElMessage.warning('没有可润色的内容');
  
  const prompt = `请润色以下内容，使其更具网感、情绪价值和可读性，适当添加 emoji。不要额外废话，直接输出润色后的文案。\n内容：\n${text}`
  const reply = await chatWithAI([{ role: 'user', content: prompt }], '你是一个资深的文案专家。');
  if (reply) {
    form[activeCat.value][textField] = reply;
    ElMessage.success('文案已自动润色并替换！');
  } else {
    ElMessage.error('润色失败');
  }
}

const suggestTags = async () => {
  ElMessage.info('正在提取高潜热点标签...')
  const prompt = `根据以下内容提取 3-5 个热门标签，仅返回以逗号分隔的标签文字，如：探店,美食,周末去哪儿。内容：\n${JSON.stringify(form[activeCat.value]).substring(0, 2000)}`
  const reply = await chatWithAI([{ role: 'user', content: prompt }], '你是一个专业的标签提取助手。');
  if (reply) {
    ElMessageBox.alert(reply, '推荐标签');
  } else {
    ElMessage.error('提取失败');
  }
}

const handleAiChat = async () => {
  if (!aiPrompt.value) return;
  const prompt = aiPrompt.value;
  aiPrompt.value = '';
  ElMessage.success('已发送给 AI 助手...');
  const context = JSON.stringify(form[activeCat.value]).substring(0, 2000);
  const reply = await chatWithAI([{ role: 'user', content: `${prompt}\n\n(参考当前表单内容：${context})` }], '你是创作助手，请根据表单内容简短回答或给出灵感。');
  if (reply) {
    ElMessageBox.alert(reply.replace(/\n/g, '<br/>'), 'AI 回复', { dangerouslyUseHTMLString: true });
  }
}

const publish = async () => {
  if (!form.title.trim()) return ElMessage.warning('请填写主标题')

  // Clean empty values helper
  const cleanObj = (obj) => {
    const cleaned = {}
    for (const [k, v] of Object.entries(obj)) {
      if (Array.isArray(v)) {
        // Filter out items with all empty values
        const filtered = v.filter(item => {
          if (typeof item === 'object') return Object.values(item).some(val => val !== '' && val != null)
          return item !== '' && item != null
        })
        if (filtered.length > 0) cleaned[k] = filtered
      } else if (v !== '' && v != null) {
        cleaned[k] = v
      }
    }
    return cleaned
  }

  try {
    const cat = activeCat.value
    let payload = cleanObj({ title: form.title, cover: form.cover })
    let endpoint = ''

    if (cat === 'article') {
      endpoint = '/articles'
      payload = {
        ...payload,
        summary: form.article.summary || '',
        content: form.article.content || '',
        category: form.article.category || '科技',
        tags: form.article.tags ? form.article.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        author_name: 'Admin',
        author_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
      }
    } else if (cat === 'food') {
      endpoint = '/food'
      payload = { ...payload, ...cleanObj(form.food) }
    } else if (cat === 'travel') {
      endpoint = '/travel'
      payload = { ...payload, ...cleanObj(form.travel) }
    } else if (cat === 'reading') {
      endpoint = '/reading'
      payload = { ...payload, ...cleanObj(form.reading) }
    } else if (cat === 'fashion') {
      endpoint = '/fashion'
      payload = { ...payload, ...cleanObj(form.fashion) }
    } else if (cat === 'sports') {
      endpoint = '/sports'
      payload = { ...payload, ...cleanObj(form.sports) }
    } else if (cat === 'photo') {
      endpoint = '/photo'
      payload = { ...payload, ...cleanObj(form.photo) }
    }

    if (endpoint) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
      await axios.post(`${baseUrl}${endpoint}`, payload)
      ElMessage.success('🎉 发布成功！')
      router.push({ path: '/', query: { cat: activeCat.value } })
    }
  } catch (err) {
    console.error('Publish error:', err)
    ElMessage.error('发布失败，请重试')
  }
}
</script>

<style scoped>
.creator-layout {
  min-height: 100vh;
  background: transparent;
  display: flex;
  flex-direction: column;
}

.creator-topbar {
  height: 60px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 20px rgba(0,0,0,0.02);
  position: sticky;
  top: 0;
  z-index: 100;
}
.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 200px;
}
.back-btn {
  text-decoration: none;
  color: #666;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s;
}
.back-btn:hover { color: #111; }
.topbar-title {
  font-weight: bold;
  font-size: 16px;
  color: #111;
  border-left: 1px solid #ddd;
  padding-left: 16px;
}

.category-selector {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.5);
}
:deep(.el-radio-button__inner) {
  border: none !important;
  background: transparent;
  box-shadow: none !important;
  border-radius: 6px !important;
  font-weight: 600;
  color: #666;
}
:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: rgba(255, 255, 255, 0.9);
  color: #111;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05) !important;
}

.topbar-right {
  display: flex;
  gap: 12px;
  width: 200px;
  justify-content: flex-end;
}

.creator-body {
  flex: 1;
  padding: 40px 20px;
  display: flex;
  justify-content: center;
}

.workspace-wrapper {
  display: flex;
  gap: 24px;
  width: 100%;
  max-width: 1200px;
  align-items: flex-start;
}

.form-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0; /* prevent flex blowout */
}

/* AI Sidebar Styles */
.ai-assistant-sidebar {
  width: 320px;
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.03);
  position: sticky;
  top: 100px;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 800;
  color: #111;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
}
.ai-icon {
  font-size: 22px;
  color: #8e44ad;
}

.ai-tools {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-tool-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
}
.ai-tool-card:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.tool-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.bg-orange { background: #ffeaa7; }
.bg-blue { background: #81ecec; }
.bg-green { background: #55efc4; }

.tool-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #111;
}
.tool-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.ai-chat-box {
  margin-top: 16px;
}
.chat-placeholder {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 16px 16px 4px 16px;
  padding: 16px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #555;
  display: flex;
  gap: 8px;
  align-items: flex-start;
  line-height: 1.5;
}
.glass-input :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.5);
  box-shadow: none;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 12px;
}
.glass-input :deep(.el-input-group__append) {
  background: transparent;
  border: none;
  box-shadow: none;
}

.form-section {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.03);
}

.mega-title-input :deep(.el-input__wrapper) {
  box-shadow: none;
  padding: 0;
  background: transparent;
}
.mega-title-input :deep(.el-input__inner) {
  font-size: 32px;
  font-weight: 800;
  height: 50px;
  color: #111;
  background: transparent;
}
.mega-title-input :deep(.el-input__inner::placeholder) {
  color: #ccc;
}

.section-label {
  display: block;
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.cover-uploader {
  width: 100%;
}
.cover-uploader :deep(.el-upload) {
  display: block;
  width: 100%;
}

.upload-placeholder {
  border: 2px dashed rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.3s;
}
.upload-placeholder:hover {
  border-color: #111;
  background: #f0f0f0;
}
.upload-icon {
  font-size: 28px;
  color: #8c939d;
  margin-bottom: 8px;
}
.el-upload__text {
  color: #666;
  font-size: 14px;
}
.el-upload__text em {
  color: #999;
  font-style: normal;
  font-size: 12px;
}

.cover-preview {
  position: relative;
  height: 240px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  cursor: pointer;
}
.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover-hover-layer {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.3s;
}
.cover-preview:hover .cover-hover-layer {
  opacity: 1;
}

.lookbook-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 12px;
}
.look-img-box {
  position: relative;
  width: 120px;
  height: 160px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.look-img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.del-img-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  opacity: 0.8;
  transform: scale(0.8);
}
.del-img-btn:hover {
  opacity: 1;
}
.lookbook-placeholder {
  width: 120px;
  height: 160px;
}

.specific-section h3 {
  margin: 0 0 24px 0;
  font-size: 20px;
  color: #111;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 2px dashed #eee;
  padding-bottom: 16px;
}

.inline-fields {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 150px;
}
.field label {
  font-size: 13px;
  color: #666;
  font-weight: bold;
}

.dynamic-list {
  margin-top: 32px;
}
.dynamic-list h4 {
  font-size: 15px;
  color: #333;
  margin: 0 0 16px 0;
}
.list-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.4);
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.6);
}
.step-num {
  font-weight: bold;
  color: #888;
  width: 24px;
  text-align: center;
}
.add-btn {
  width: 100%;
  border-style: dashed;
  margin-top: 8px;
  color: #666;
}
.add-btn:hover {
  border-color: #111;
  color: #111;
}

@media (max-width: 768px) {
  .creator-topbar { flex-direction: column; height: auto; padding: 16px; gap: 16px; }
  .topbar-left, .topbar-right { width: 100%; justify-content: center; }
  .inline-fields { flex-direction: column; }
}
</style>
