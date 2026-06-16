<template>
  <div class="hot-ranking">
    <div class="rank-card">
      <div class="rank-header"><span class="rank-title">🔥 热文榜单</span><span class="rank-sub">本周</span></div>
      <div class="rank-list">
        <div v-for="(item, idx) in articleRank" :key="item.id" class="rank-item">
          <span :class="[`rank-num`, { top3: idx < 3 }]">{{ idx + 1 }}</span>
          <div class="rank-content">
            <p class="rank-item-title">{{ item.title }}</p>
            <p class="rank-item-meta">{{ item.views }} 阅读 · {{ item.likes }} 赞</p>
          </div>
        </div>
      </div>
    </div>
    <div class="rank-card">
      <div class="rank-header"><span class="rank-title">✍️ 人气作者</span></div>
      <div class="author-list">
        <div v-for="(author, idx) in authorRank" :key="author.name" class="author-item">
          <span :class="[`rank-num`, { top3: idx < 3 }]">{{ idx + 1 }}</span>
          <el-avatar :size="32" :icon="UserFilled" class="author-avatar" />
          <div class="author-info"><p class="author-name">{{ author.name }}</p><p class="author-meta">{{ author.fans }} 粉丝</p></div>
          <span class="follow-btn" @click="author.followed = !author.followed">{{ author.followed ? `已关注` : `+ 关注` }}</span>
        </div>
      </div>
    </div>
    <div class="rank-card">
      <div class="rank-header"><span class="rank-title"># 热门话题</span></div>
      <div class="tag-cloud">
        <span v-for="tag in hotTags" :key="tag.name" :class="[`tag-chip`, tag.hot ? `hot` : ``]">#{{ tag.name }}<small>{{ tag.count }}</small></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { UserFilled } from '@element-plus/icons-vue'

const articleRank = ref([
  { id: 1, title: '大理三日慢游攻略：不赶景点只享受风花雪月', views: '2.9w', likes: '2.1k' },
  { id: 2, title: '入门摄影必看：掌握这3个构图技巧手机也能拍大片', views: '3.4w', likes: '2.8k' },
  { id: 3, title: '养猫三年踩过的坑：新手铲屎官避雷指南', views: '3.1w', likes: '2.4k' },
  { id: 4, title: '观影日记：那些让我哭到停不下来的电影', views: '2.5w', likes: '1.8k' },
  { id: 5, title: '居家健身半年体重没变但所有人都说我瘦了', views: '1.9w', likes: '1.5k' },
  { id: 6, title: '五月读书笔记：这5本书治好了我的精神内耗', views: '1.8w', likes: '1.4k' },
  { id: 7, title: '周末探店：藏在巷子里的宝藏日料店', views: '1.5w', likes: '1.2k' },
  { id: 8, title: '2026上半年最值得听的10张华语专辑', views: '1.2w', likes: '876' },
])

const authorRank = ref([
  { name: '摄影师阿杰', fans: '12.8k', followed: false },
  { name: '流浪的小鹿', fans: '9.6k', followed: true },
  { name: '铲屎官小美', fans: '8.3k', followed: false },
  { name: '吃货小王', fans: '7.1k', followed: false },
  { name: '运动达人Ken', fans: '5.4k', followed: false },
])

const hotTags = [
  { name: '夏日旅行', count: '2.3w帖', hot: true },
  { name: '美食探店', count: '1.8w帖', hot: true },
  { name: '宠物日常', count: '1.5w帖', hot: true },
  { name: '摄影技巧', count: '1.2w帖', hot: false },
  { name: '读书分享', count: '9.8k帖', hot: false },
  { name: '居家好物', count: '8.6k帖', hot: false },
  { name: '城市漫步', count: '7.2k帖', hot: false },
  { name: '治愈日常', count: '6.5k帖', hot: false },
]
</script><style scoped>
.hot-ranking{display:flex;flex-direction:column;gap:12px;width:300px;flex-shrink:0}
.rank-card{background:#fff;border-radius:10px;border:1px solid #f0f0f0;overflow:hidden}
.rank-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #f5f6f7}
.rank-title{font-size:15px;font-weight:700;color:#252933}
.rank-sub{font-size:11px;color:#bbb}
.rank-list{padding:4px 0}
.rank-item{display:flex;align-items:flex-start;gap:10px;padding:10px 16px;cursor:pointer;transition:background .15s}
.rank-item:hover{background:#fafbfc}
.rank-num{width:20px;height:20px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#999;background:#f5f6f7;flex-shrink:0;margin-top:1px}
.rank-num.top3{color:#fff;background:linear-gradient(135deg,#fc3c44,#ff6b6b)}
.rank-content{flex:1;min-width:0}
.rank-item-title{margin:0;font-size:13px;color:#333;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.rank-item-meta{margin:4px 0 0;font-size:11px;color:#bbb}
.author-list{padding:4px 0}
.author-item{display:flex;align-items:center;gap:10px;padding:10px 16px;cursor:pointer;transition:background .15s}
.author-item:hover{background:#fafbfc}
.author-avatar{flex-shrink:0;border:2px solid #f0f0f0}
.author-info{flex:1;min-width:0}
.author-name{margin:0;font-size:13px;font-weight:600;color:#333}
.author-meta{margin:2px 0 0;font-size:11px;color:#bbb}
.follow-btn{font-size:12px;padding:4px 12px;border-radius:12px;border:1px solid #fc3c44;color:#fc3c44;cursor:pointer;background:#fff;transition:all .2s;white-space:nowrap;flex-shrink:0}
.follow-btn:hover{background:#fc3c44;color:#fff}
.tag-cloud{display:flex;flex-wrap:wrap;gap:8px;padding:14px 16px}
.tag-chip{font-size:13px;padding:6px 12px;border-radius:16px;background:#f5f6f7;color:#666;cursor:pointer;transition:all .2s}
.tag-chip:hover{background:#fdf2f3;color:#fc3c44}
.tag-chip.hot{color:#fc3c44;background:#fef0f0;font-weight:600}
.tag-chip small{font-size:11px;margin-left:4px;opacity:.7}
</style>
