const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

app.use(
  cors({
    origin: "*",
  })
);

app.use(
  "/api/shopping_list",
  createProxyMiddleware({
    target: `https://${process.env.EXPO_PUBLIC_API_HOST}/`,
    changeOrigin: true,
    secure: true,
  })
);

// const wsProxy = createProxyMiddleware("/api/websocket", {
//   target: `wss://${process.env.EXPO_PUBLIC_API_HOST}/api/websocket`,
//   // pathFilter:'/api/websocket',
//   changeOrigin: true,
//   secure:true,
//   ws: true,
// });

// app.use("/api/websocket", wsProxy);

app.listen(3000);

// app.on("upgrade", wsProxy.upgrade);
