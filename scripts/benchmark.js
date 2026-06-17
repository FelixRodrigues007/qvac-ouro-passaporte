/**
 * Benchmark / evidence bundle — runs the REAL pipeline several times and records
 * per-run metrics (reusing the src/audit.js instrumentation that the pipeline
 * already writes to out/<id>.audit.json) into logs/evidence.jsonl, then writes a
 * clear LOCAL-vs-DELEGATED summary to logs/evidence-summary.md. Nothing invented.
 *
 *   npm run benchmark                              # 5 local runs (default)
 *   npm run benchmark -- --local 8                 # 8 local runs
 *   npm run benchmark -- --delegate <providerKey>  # + 3 delegated (P2P) runs
 *   npm run benchmark -- --delegate <key> --delegated 5
 */
import { readFileSync, appendFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { buildPassport } from "../src/pipeline.js";
import { close } from "@qvac/sdk";

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const LOCAL_N = parseInt(opt("--local", "5"), 10);
const DELEGATE_KEY = opt("--delegate", null);
const DELEGATED_M = parseInt(opt("--delegated", "3"), 10);
const IMG = "samples/laudo-ouro-EXEMPLO.png";
const JSONL = "logs/evidence.jsonl";

mkdirSync("logs", { recursive: true });

async function runOnce(mode, idx) {
  const { passport, id } = await buildPassport(IMG, mode === "delegated" ? { delegate: DELEGATE_KEY } : {});
  const audit = JSON.parse(readFileSync(`out/${id}.audit.json`, "utf8"));
  const ocr = audit.models?.["OCR (ONNX)"] || {};
  const llm = audit.models?.["LLM (Qwen3 4B)"] || {};
  const inf = (audit.inferences || [])[0] || {};
  const rec = {
    ts: new Date().toISOString(),
    mode,
    run: idx,
    device: audit.device,
    ocr_load_ms: ocr.load_ms ?? null,
    llm_load_ms: llm.load_ms ?? null,
    isDelegated: llm.delegated === true,
    provider: llm.provider ? String(llm.provider).slice(0, 16) : null,
    ttft_ms: inf.ttft_ms ?? null,
    output_tokens: inf.output_tokens ?? null,
    tokens_per_sec: inf.tokens_per_sec ?? null,
    status: passport?.verificacao?.status_licenca ?? null,
  };
  appendFileSync(JSONL, JSON.stringify(rec) + "\n");
  console.log(`  ✓ [${mode}] run ${idx}: TTFT ${rec.ttft_ms} ms · ${rec.tokens_per_sec} tok/s · ${rec.output_tokens} tok · OCR ${rec.ocr_load_ms} ms · LLM ${rec.llm_load_ms} ms · isDelegated=${rec.isDelegated} · status=${rec.status}`);
}

console.log(`▶ Benchmark: ${LOCAL_N} local run(s)` + (DELEGATE_KEY ? ` + ${DELEGATED_M} delegated run(s)` : ""));
for (let i = 1; i <= LOCAL_N; i++) {
  try { await runOnce("local", i); } catch (e) { console.error(`  ✗ local run ${i} failed:`, e?.message ?? e); }
}
if (DELEGATE_KEY) {
  for (let i = 1; i <= DELEGATED_M; i++) {
    try { await runOnce("delegated", i); } catch (e) { console.error(`  ✗ delegated run ${i} failed:`, e?.message ?? e); }
  }
}
try { await close(); } catch {}

// ---- summary, computed from the FULL evidence.jsonl (cumulative across invocations) ----
const rows = existsSync(JSONL)
  ? readFileSync(JSONL, "utf8").trim().split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)
  : [];
const avg = (set, f) => { const v = set.map((r) => r[f]).filter((x) => typeof x === "number"); return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "—"; };
const local = rows.filter((r) => r.mode === "local");
const deleg = rows.filter((r) => r.mode === "delegated");
const dev = rows.find((r) => r.device)?.device || {};
const devStr = dev.chip ? `${dev.model || ""} · ${dev.chip} · ${dev.ram_gb} GB RAM · ${dev.os}`.replace(/^ · /, "") : "(see audit log)";
// Side-by-side row: TTFT and tok/s are averaged across ALL runs of a mode (the
// model-load cost does not affect them, so the cold run does not distort these).
const row = (label, set) => `| ${label} | ${set.length} | ${avg(set, "ttft_ms")} | ${avg(set, "tokens_per_sec")} |`;

// COLD vs WARM split for the LOCAL LLM load only: run 1 of each fresh process is
// a cold load (~20 s — the ~1 GB model read into memory the first time); runs 2+
// are warm (model already resident). Reporting them separately keeps the one-time
// cold cost from distorting the steady-state number.
const max = (set, f) => { const v = set.map((r) => r[f]).filter((x) => typeof x === "number"); return v.length ? +Math.max(...v).toFixed(1) : "—"; };
const localCold = local.filter((r) => r.run === 1);
const localWarm = local.filter((r) => r.run >= 2);
// Report the WORST cold observed — the genuine cold-disk first load (a later
// "run 1" can be faster if the OS still has the model file in page cache, which
// understates the true one-time cost). Warm is the steady-state average.
const coldLlm = max(localCold, "llm_load_ms");
const warmLlm = avg(localWarm, "llm_load_ms");
const ocrLocal = avg(local, "ocr_load_ms");

const md = `# AuPass — Evidence Bundle (real, measured)

_Generated ${new Date().toISOString()}. Every number below comes from the on-device audit log (\`src/audit.js\`) written on each run — nothing is hand-written._

- **Device:** ${devStr}
- **Total runs:** ${rows.length}  (local: ${local.length}, delegated / P2P: ${deleg.length})
- **Document:** \`${IMG}\` · **passport status (last run):** ${rows[rows.length - 1]?.status ?? "—"}

## Local vs Delegated (P2P) — inference

TTFT and tok/s are averaged across **all** runs of each mode (model-load cost does not affect them).

| Mode | Runs | Avg TTFT (ms) | Avg tokens/sec |
|------|-----:|--------------:|---------------:|
${row("Local — on-device", local)}
${row("Delegated — P2P peer", deleg)}
${deleg.length ? "" : "\n_No delegated runs yet — add them with `npm run benchmark -- --delegate <providerKey>` (the provider must be running)._\n"}
The **delegated** rows run the LLM on a **peer's GPU over an end-to-end-encrypted P2P link** (QVAC over Holepunch's DHT), while **OCR, the rule-based verification, and the SHA-256 seal stay local** on this device.

## Model load — COLD vs WARM (local mode)

The LLM is loaded into memory before inference. The **first** load on a fresh machine is *cold* (model read from disk); later loads are *warm* (model already resident). Reported separately so the one-time cold cost does not distort the average.

| Load | When | ms |
|------|------|---:|
| LLM — **cold** (first use, cold disk) | one-time, worst case observed | ${coldLlm} |
| LLM — **warm** (avg of runs 2+) | steady state | ${warmLlm} |
| OCR (ONNX) | avg of all local runs | ${ocrLocal} |

> **Cold load is a one-time cost** — the price of reading the ~1 GB model off disk into memory the first time. Once resident, every later run pays only the warm cost. Steady-state performance is the warm number.

**What "delegated" means:** the heavy **LLM runs on a peer's machine** over an **end-to-end-encrypted peer-to-peer connection** (QVAC over Holepunch's DHT) — no server, no cloud. Meanwhile **OCR, the rule-based verification, and the SHA-256 seal stay local** on this device. So the delegated rows measure a model running on a *remote GPU reached over P2P*, while the rest of the trust pipeline is still on-device.

Raw per-run records (one JSON object per line): [\`evidence.jsonl\`](evidence.jsonl)
`;

writeFileSync("logs/evidence-summary.md", md);
console.log("\n✅ wrote logs/evidence.jsonl and logs/evidence-summary.md");
