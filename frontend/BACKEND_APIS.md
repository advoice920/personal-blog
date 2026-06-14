# 后端接口要求 (Backend APIs Requirements)

本项目所需的后端接口清单及要求如下：

1. **基础 URL (Base URL)**
   - 可以在环境变量 `VITE_API_BASE_URL` 中配置，默认为空（即相对路径或直接在同域名下访问）。
   - 如果接口请求失败或未配置 `VITE_API_BASE_URL`，应用会自动回退并从本地的 `mock.sqlite` 中读取数据。

2. **接口规范**
   - **请求格式**: GET 请求。
   - **响应格式**: 所有接口均应返回 JSON 数组格式（`Array<Object>`），如果接口包含特定字段或嵌套数据结构（例如包含标签数组 `tags`），需要以正确的 JSON 格式返回。

3. **具体接口清单**
   - **获取文章列表**
     - 路径: `/articles`
     - 数据字段: 包含 `tags`（数组/JSON字符串），以及 `author_name` 和 `author_avatar`。
   - **获取美食数据**
     - 路径: `/food`
     - 数据字段: 包含 `ingredients`（材料列表）和 `steps`（步骤列表）。
   - **获取旅行数据**
     - 路径: `/travel`
     - 数据字段: 包含 `itinerary`（行程）和 `tips`（贴士）。
   - **获取摄影数据**
     - 路径: `/photo`
     - 数据字段: 基本图片数据。
   - **获取阅读数据**
     - 路径: `/reading`
     - 数据字段: 包含 `tags`。
   - **获取音乐数据**
     - 路径: `/music`
     - 数据字段: 包含 `tags`，`desc`（描述），以及 `songs`（歌曲列表）。
   - **获取电影数据**
     - 路径: `/movie`
     - 数据字段: 包含 `tags`，以及 `cover`（封面图 URL）、`thumbnail` 等基本信息。
   - **获取穿搭数据**
     - 路径: `/fashion`
     - 数据字段: 包含 `lookbook`（穿搭图册/清单）。

> 注：部分接口如 `getSportsData` 目前在前端是写死的静态数据，不通过后端请求。
