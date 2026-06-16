const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
const contentRoutes = require("./routes/content");
const authRoutes = require("./routes/auth");
const searchRoutes = require("./routes/search");
const interactionRoutes = require("./routes/interaction");
const usersRoutes = require("./routes/users");
const uploadRoutes = require("./routes/upload");
const scrapeRoutes = require("./routes/scrape");
const historyRoutes = require("./routes/history");
const aiRoutes = require("./routes/ai");
const tianapiRoutes = require("./routes/tianapi");
const musicRoutes = require("./routes/music");
const rssRoutes = require("./routes/rss");
const imageProxyRoutes = require("./routes/imageProxy");
const movieReviewsRoutes = require("./routes/movieReviews");
const photoRoutes = require("./routes/photos");

app.use("/api/music", musicRoutes);
app.use("/api", contentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/interaction", interactionRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/scrape", scrapeRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/tianapi", tianapiRoutes);
app.use("/api/rss", rssRoutes);
app.use("/api/img", imageProxyRoutes);
app.use("/api/movie", movieReviewsRoutes);
app.use("/api/photos", photoRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

app.listen(port, async () => {
  console.log(`Server listening at http://localhost:${port}`);

  // Auto-init database tables (idempotent)
  try {
    const initDB = require('./init_db_auto');
    await initDB();
  } catch (e) {
    console.warn('[DB] Init skip:', e.message);
  }

  // Auto-fetch RSS on startup, then every 6 hours
  try {
    const rssService = require('./services/rssService');
    const count = await rssService.fetchAllAndSave();
    console.log(`[RSS] Startup fetch: ${count} new articles`);
  } catch (e) {
    console.warn('[RSS] Startup fetch failed:', e.message);
  }

  setInterval(async () => {
    try {
      const rssService = require('./services/rssService');
      const count = await rssService.fetchAllAndSave();
      if (count > 0) console.log(`[RSS] Auto-refresh: ${count} new articles`);
    } catch (e) {
      console.warn('[RSS] Auto-refresh failed:', e.message);
    }
  }, 6 * 60 * 60 * 1000); // Every 6 hours
});

// trigger nodemon
