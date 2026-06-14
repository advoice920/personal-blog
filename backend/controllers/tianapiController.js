const axios = require("axios");
const { success, error } = require("../utils/response");

const TIANAPI_KEY = process.env.TIANAPI_KEY || "ec7b449dff1e02a2bf6dd10790259747";
const TIANAPI_BASE = "https://apis.tianapi.com";

// Supported TianAPI categories mapped to their endpoint paths
const categoryMap = {
  travel: "travel/index",
  food: "food/index",
  music: "music/index",
  movie: "film/index",
  sports: "sport/index",
  fashion: "fashion/index",
  reading: "book/index",
  photo: "photography/index",
  hot: "social/index",
};

const getTianApiData = async (req, res) => {
  try {
    const { category = "travel" } = req.params;
    let { page = 1, num = 25, word, tag } = req.query;

    const endpoint = categoryMap[category];
    if (!endpoint) {
      return error(res, `Unsupported category: ${category}. Supported: ${Object.keys(categoryMap).join(", ")}`, 400);
    }

    page = parseInt(page);
    num = parseInt(num);

    let url = `${TIANAPI_BASE}/${endpoint}?key=${TIANAPI_KEY}&num=${num}&page=${page}`;
    if (word) {
      url += `&word=${encodeURIComponent(word)}`;
    }
    if (tag) {
      url += `&tag=${encodeURIComponent(tag)}`;
    }

    const response = await axios.get(url, { timeout: 5000 });

    if (response.data.code !== 200) {
      return error(res, response.data.msg || "TianAPI error", response.data.code || 500);
    }

    const newslist = response.data.result?.newslist || response.data.result?.list || [];
    const total = response.data.result?.allnum || newslist.length;

    // Normalize items to a common format
    const items = newslist.map((item) => ({
      id: item.id || Math.random().toString(36).substr(2, 9),
      title: item.title || "",
      summary: item.description || item.content || "",
      thumbnail: item.picUrl || item.pic || "",
      cover: item.picUrl || item.pic || "",
      url: item.url || "",
      source: item.source || "",
      category: category,
      tags: [item.source || category],
      views: Math.floor(Math.random() * 50000) + 1000,
      likes: Math.floor(Math.random() * 5000) + 100,
      comments: Math.floor(Math.random() * 500),
      createdAt: item.ctime || new Date().toISOString(),
      created_at: item.ctime || new Date().toISOString(),
      author: {
        name: item.source || "特约作者",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.source || "author")}`,
      },
    }));

    return success(res, { items, total, page, num, isApi: true }, "TianAPI data fetched");
  } catch (err) {
    console.error("TianAPI proxy error:", err.message);
    return error(res, "Failed to fetch TianAPI data: " + err.message);
  }
};

// Get list of supported categories
const getCategories = async (req, res) => {
  return success(res, Object.keys(categoryMap), "Supported categories");
};

module.exports = { getTianApiData, getCategories };
