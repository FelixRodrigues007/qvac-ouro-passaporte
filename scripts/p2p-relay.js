/**
 * P2P RELAY — a tiny HTTP gateway that proves QVAC delegated inference LIVE.
 *
 * It acts as the CONSUMER: it loads the LLM via P2P DELEGATION to a provider
 * (no local model, fallbackToLocal:false) and exposes it over HTTP, so a browser
 * can trigger a real peer-run inference. The actual inference still happens
 * peer-to-peer between two QVAC nodes; this relay is only the HTTP front door.
 *
 * Run (a provider must already be running in another terminal):
 *   PROVIDER_KEY=<hex> npm run p2p:relay
 * Then expose it over HTTPS (e.g. `cloudflared tunnel --url http://localhost:8787`)
 * and open the site with ?relay=https://<your-tunnel>.
 *
 * Endpoints (CORS enabled):
 *   GET /health    -> { ok, isDelegated, provider }
 *   GET /delegate  -> short delegated completion -> { isDelegated, provider, answer, stats }
 */
import { createServer } from "node:http";
import { loadModel, completion, getLoadedModelInfo, unloadModel } from "@qvac/sdk";
import { LLM_MODEL } from "../src/config.js";

const PROVIDER_KEY = process.env.PROVIDER_KEY;
const PORT = Number(process.env.PORT || 8787);
if (!PROVIDER_KEY) {
  console.error("Usage: PROVIDER_KEY=<provider-public-key-hex> npm run p2p:relay");
  process.exit(1);
}

console.log("⏳ Connecting to provider via P2P delegation…", PROVIDER_KEY.slice(0, 8) + "…");

let modelId, info;

// (Re)establish the delegated session and refresh the cached info. The model id
// is deterministic, so re-issuing loadModel re-registers our session with the
// provider — needed when a long-lived/idle session goes stale (another consumer
// unloaded the shared model, the connection was GC'd, or the provider recycled).
async function connectDelegated() {
  modelId = await loadModel({
    modelSrc: LLM_MODEL,
    modelType: "llm",
    delegate: { providerPublicKey: PROVIDER_KEY, fallbackToLocal: false },
  });
  info = await getLoadedModelInfo({ modelId });
  return info;
}

await connectDelegated();
console.log("✅ Delegated model ready. isDelegated:", info.isDelegated);

// Runs one short delegated completion and returns the cleaned answer + stats.
async function delegatedComplete(prompt) {
  // /no_think keeps Qwen3 from emitting a long reasoning block -> fast, short answer
  // (a slow ~12s response stalls the cloudflare/ngrok tunnel in browsers).
  const run = completion({
    modelId,
    history: [
      { role: "system", content: "/no_think\nResponda de forma curta e direta, em no máximo 12 palavras." },
      { role: "user", content: prompt },
    ],
    stream: true,
  });
  let answer = "";
  for await (const ev of run.events) if (ev.type === "contentDelta") answer += ev.text;
  const final = await run.final;
  return { answer: answer.replace(/<think>[\s\S]*?<\/think>/gi, "").trim(), final };
}

// The provider reports "Model with ID … not found" when our delegated session
// has gone stale; reconnecting (connectDelegated) re-registers and recovers it.
const isStaleSession = (e) => /not found|delegated provider error|communicating with provider/i.test(String(e?.message ?? e));

const cors = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, ngrok-skip-browser-warning");
};
const json = (res, code, obj) => { cors(res); res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") { cors(res); res.writeHead(204); return res.end(); }
  const url = new URL(req.url, "http://x");

  if (url.pathname === "/health") {
    return json(res, 200, { ok: true, isDelegated: info.isDelegated, provider: PROVIDER_KEY.slice(0, 16) });
  }

  if (url.pathname === "/delegate") {
    const prompt = url.searchParams.get("q") || "O que é ouro?";
    try {
      let out;
      try {
        out = await delegatedComplete(prompt);
      } catch (e) {
        if (!isStaleSession(e)) throw e;
        // Stale delegated session: re-delegate once and retry.
        console.log("↻ Delegated session stale, reconnecting…");
        await connectDelegated();
        out = await delegatedComplete(prompt);
      }
      return json(res, 200, { isDelegated: info.isDelegated, provider: PROVIDER_KEY.slice(0, 16), answer: out.answer, stats: out.final.stats });
    } catch (e) {
      return json(res, 502, { error: String(e?.message ?? e) });
    }
  }

  json(res, 404, { error: "not found" });
});

server.listen(PORT, () => console.log(`🛰️  Relay on http://localhost:${PORT}  (GET /delegate · /health)`));

async function shutdown() { try { await unloadModel({ modelId }); } catch {} process.exit(0); }
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
