/**
 * CLI entry point.
 * Accepts an image (offline OCR) or a digital PDF with a text layer.
 * Usage: npm run passport -- ./samples/<file> [--delegate <providerPublicKey>]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { close } from "@qvac/sdk";
import { buildPassport } from "./pipeline.js";

const SELOS = {
  valida: "✅ VALID",
  vencida: "⛔ EXPIRED",
  atencao: "🟡 ATTENTION (pending issues)",
  incompleta: "🟠 INCOMPLETE",
  nao_identificado: "⬜ NOT IDENTIFIED",
};

// Arg parsing: the first argument that does NOT start with "--" is the document path;
// "--delegate <key>" delegates ONLY the LLM extraction to a P2P peer.
const args = process.argv.slice(2);
let docPath = null;
let delegateKey = null;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--delegate") delegateKey = args[++i] ?? null;
  else if (!a.startsWith("--") && docPath === null) docPath = a;
}
if (!docPath) {
  console.error("Usage: node src/index.js <image-or-pdf-path> [--delegate <providerPublicKey>]");
  process.exit(1);
}

try {
  if (delegateKey) {
    console.log("🛰️  Extraction will be DELEGATED to peer: " + delegateKey.slice(0, 8) + "…");
  }
  console.log("📄 Reading document (offline):", docPath);
  const { rawText, passport, id } = await buildPassport(docPath, { delegate: delegateKey || null });

  console.log("\n--- Raw text (OCR) ---\n" + rawText);
  console.log("\n--- Provenance passport ---");
  console.log(JSON.stringify(passport, null, 2));

  const v = passport.verificacao || {};
  console.log("\n========================================");
  console.log("  STATUS: " + (SELOS[v.status_licenca] || v.status_licenca));
  console.log("========================================");
  for (const c of (v.checagens || [])) console.log("  " + c);
  console.log("");

  // Saves the sealed passport to out/<id>.passport.json (sensitive data, outside git).
  mkdirSync("out", { recursive: true });
  const caminho = join("out", `${id}.passport.json`);
  writeFileSync(caminho, JSON.stringify(passport, null, 2), "utf8");

  console.log("🔏 Seal (SHA-256): " + (passport.selo?.hash || "(no seal)"));
  console.log("📄 File: " + caminho);
  console.log("📈 Audit: out/" + id + ".audit.json\n");
} catch (error) {
  console.error("❌ Error:", error);
  process.exitCode = 1;
} finally {
  await close();
}
