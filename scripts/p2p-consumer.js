/**
 * P2P CONSUMER — loads the SAME LLM by DELEGATION to a remote provider
 * (no local model), then runs a short completion that executes on the
 * provider's machine.
 *
 * Run:   PROVIDER_KEY=<hex> npm run p2p:consumer
 *
 * fallbackToLocal:false is intentional — we want to PROVE the delegation,
 * not silently fall back to local inference. If the provider is unreachable,
 * loadModel throws (DELEGATE_CONNECTION_FAILED / DELEGATE_PROVIDER_ERROR / …)
 * and we let that error surface as-is.
 */
import { loadModel, completion, getLoadedModelInfo, heartbeat, unloadModel } from "@qvac/sdk";
import { LLM_MODEL } from "../src/config.js";

const providerPublicKey = process.env.PROVIDER_KEY;
if (!providerPublicKey) {
  console.error("Usage: PROVIDER_KEY=<provider-public-key-hex> npm run p2p:consumer");
  process.exit(1);
}

// (optional) Is the provider reachable? heartbeat throws if it is offline.
try {
  const hb = await heartbeat({ delegate: { providerPublicKey, timeout: 5000 } });
  console.log("✅ Provider online (heartbeat #" + hb.number + ")");
} catch (e) {
  console.error("⚠️  Heartbeat failed (provider may be offline):", e?.message ?? e);
}

console.log("⏳ Loading the LLM via DELEGATION (no local model)…");
const modelId = await loadModel({
  modelSrc: LLM_MODEL,
  modelType: "llm",
  delegate: { providerPublicKey, fallbackToLocal: false },
});

const info = await getLoadedModelInfo({ modelId });
console.log("isDelegated:", info.isDelegated);

console.log("\n💬 Completion (executing on the provider):");
const run = completion({
  modelId,
  history: [{ role: "user", content: "Responda em 5 palavras: o que é ouro?" }],
  stream: true,
});

for await (const ev of run.events) {
  if (ev.type === "contentDelta") process.stdout.write(ev.text);
}

const final = await run.final;
console.log("\n\n📊 stats: " + JSON.stringify(final.stats, null, 2));

await unloadModel({ modelId });
