// src/wa/index.ts
import { connectAllCafes } from "./socket";
import { setupInboundHandler } from "./messages";

async function main() {
  console.log("[WA] Starting WhatsApp bot...");

  const cafeSockets = await connectAllCafes();
  console.log(`[WA] Connected to ${cafeSockets.size} café(s)`);

  setupInboundHandler(cafeSockets);
  console.log("[WA] Inbound handler active. Waiting for messages...");

  // Keep process alive
  process.on("SIGINT", () => {
    console.log("[WA] Shutting down...");
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[WA] Fatal error:", err);
  process.exit(1);
});
