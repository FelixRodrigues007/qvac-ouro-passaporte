/**
 * P2P PROVIDER — loads the LLM locally and serves it to remote peers over
 * QVAC's delegated inference (Holepunch DHT). Keep this process running.
 *
 * Run:   npm run p2p:provider
 * Then copy the printed PROVIDER_PUBLIC_KEY into the consumer.
 * Ctrl+C stops the provider cleanly.
 *
 * Note: the provider keypair (its public key) can be pinned via the
 * QVAC_HYPERSWARM_SEED env var; without it a fresh key is generated per run.
 */
import { loadModel, startQVACProvider, stopQVACProvider, unloadModel } from "@qvac/sdk";
import { LLM_MODEL } from "../src/config.js";

console.log("⏳ Loading the LLM locally (provider side)…");
const modelId = await loadModel({
  modelSrc: LLM_MODEL,
  modelType: "llm",
  modelConfig: { ctx_size: 8192, temp: 0.2 },
});
console.log("✅ Model loaded:", modelId);

// firewall is optional; {} serves any peer that knows the public key.
const res = await startQVACProvider({});
if (!res.success || !res.publicKey) {
  console.error("❌ Failed to start provider:", res.error ?? res);
  await unloadModel({ modelId });
  process.exit(1);
}

console.log("PROVIDER_PUBLIC_KEY=" + res.publicKey);
console.log("🛰️  Provider is serving over P2P. Start the consumer with that key. Ctrl+C to stop.");

// Clean shutdown on Ctrl+C: stop serving, unload, exit.
let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  console.log("\n🧹 Stopping provider…");
  try { await stopQVACProvider(); } catch (e) { console.error("stopQVACProvider:", e?.message ?? e); }
  try { await unloadModel({ modelId }); } catch (e) { console.error("unloadModel:", e?.message ?? e); }
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// The DHT swarm keeps the event loop alive; nothing else to do here.
