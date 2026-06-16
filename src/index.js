/**
 * CLI entry point.
 * Usage: npm run passport -- ./samples/<file>
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

const imagePath = process.argv[2];
if (!imagePath) {
  console.error("Usage: node src/index.js <image-path>");
  process.exit(1);
}

try {
  console.log("📷 Reading document (offline):", imagePath);
  const { rawText, passport, id } = await buildPassport(imagePath);

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
