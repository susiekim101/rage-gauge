// WebSocket proxy — forwards between the app and Gemini Live API
// Run with: node server.js

const { WebSocketServer, WebSocket } = require("ws");
require("dotenv").config();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Missing GEMINI_API_KEY in .env");
  process.exit(1);
}

const GEMINI_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

const wss = new WebSocketServer({ port: 8081 });
console.log("Proxy listening on ws://localhost:8081");

wss.on("connection", (appSocket) => {
  console.log("[proxy] app connected");

  const gemini = new WebSocket(GEMINI_URL);
  const queue = [];

  gemini.on("open", () => {
    console.log("[proxy] connected to Gemini");
    queue.forEach((msg) => gemini.send(msg));
    queue.length = 0;
  });
  gemini.on("message", (data) => {
    console.log("[gemini msg]", data.toString().slice(0, 300));
    if (appSocket.readyState === WebSocket.OPEN) appSocket.send(data);
  });
  gemini.on("error", (e) => console.error("[gemini error]", e.message));
  gemini.on("close", (code, reason) => {
    console.log("[proxy] Gemini closed", code, reason.toString());
    appSocket.close();
  });

  appSocket.on("message", (data) => {
    if (gemini.readyState === WebSocket.OPEN) gemini.send(data);
    else queue.push(data);
  });
  appSocket.on("close", () => {
    console.log("[proxy] app disconnected");
    gemini.close();
  });
  appSocket.on("error", (e) => console.error("[app error]", e.message));
});
