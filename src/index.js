/**
 * Entrada CLI.
 * Uso: npm run passport -- ./samples/<arquivo>
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { close } from "@qvac/sdk";
import { buildPassport } from "./pipeline.js";

/** Transforma o lote num id seguro p/ nome de arquivo (ou null se vazio). */
function sanitizarId(valor) {
  if (!valor || typeof valor !== "string") return null;
  const limpo = valor
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return limpo || null;
}

const SELOS = {
  valida: "✅ VÁLIDA",
  vencida: "⛔ VENCIDA",
  atencao: "🟡 ATENÇÃO (com pendências)",
  incompleta: "🟠 INCOMPLETA",
  nao_identificado: "⬜ NÃO IDENTIFICADA",
};

const imagePath = process.argv[2];
if (!imagePath) {
  console.error("Uso: node src/index.js <caminho-da-imagem>");
  process.exit(1);
}

try {
  console.log("📷 Lendo documento (offline):", imagePath);
  const { rawText, passport } = await buildPassport(imagePath);

  console.log("\n--- Texto bruto (OCR) ---\n" + rawText);
  console.log("\n--- Passaporte de procedência ---");
  console.log(JSON.stringify(passport, null, 2));

  const v = passport.verificacao || {};
  console.log("\n========================================");
  console.log("  STATUS: " + (SELOS[v.status_licenca] || v.status_licenca));
  console.log("========================================");
  for (const c of (v.checagens || [])) console.log("  " + c);
  console.log("");

  // Salva o passaporte selado em out/<id>.passport.json (dado sensível, fora do git).
  const id = sanitizarId(passport?.origem?.lote) || `passaporte-${Date.now()}`;
  mkdirSync("out", { recursive: true });
  const caminho = join("out", `${id}.passport.json`);
  writeFileSync(caminho, JSON.stringify(passport, null, 2), "utf8");

  console.log("🔏 Selo (SHA-256): " + (passport.selo?.hash || "(sem selo)"));
  console.log("📄 Arquivo: " + caminho + "\n");
} catch (error) {
  console.error("❌ Erro:", error);
  process.exitCode = 1;
} finally {
  await close();
}
