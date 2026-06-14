require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 前端代理
const distPath = path.join(__dirname, "../Client/dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log("已挂载前端静态文件");
}

// 路由
app.use("/api/auth", require("./routes/auth"));
app.use("/api", require("./routes/issue"));
app.use("/api", require("./routes/vote"));
app.use("/api", require("./routes/vsingers"));
app.use("/api/notice", require("./routes/notice"));
app.use("/api", require("./routes/dailyQuote"));
app.use("/api/migration", require("./routes/migration"));

// SPA fallback
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    if (fs.existsSync(distPath)) {
      res.sendFile(path.join(distPath, "index.html"));
    } else {
      res.status(404).send("前端未构建，请运行 npm run build");
    }
  } else {
    next();
  }
});

// 初始化数据库
require("./models");

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`后端服务运行在 http://localhost:${PORT}`);
});
