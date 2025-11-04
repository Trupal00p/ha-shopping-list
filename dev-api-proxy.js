require("dotenv").config({ path: ".env.local" });
const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

app.use(
  cors({
    origin: "*",
  })
);

// REST API proxy - proxy all /api/* requests
app.use(
  "/api",
  createProxyMiddleware({
    target: `https://${process.env.EXPO_PUBLIC_API_HOST}/`,
    changeOrigin: true,
    secure: true,
  })
);

// WebSocket proxy
const wsProxy = createProxyMiddleware("/api/websocket", {
  target: `https://${process.env.EXPO_PUBLIC_API_HOST}/`,
  changeOrigin: true,
  secure: true,
  ws: true,
});

app.use("/api/websocket", wsProxy);

const server = app.listen(3000);

// Enable WebSocket upgrade
server.on("upgrade", wsProxy.upgrade);
