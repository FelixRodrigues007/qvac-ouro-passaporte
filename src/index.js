/**
 * Entrada CLI.
 * Uso: npm run passport -- ./samples/<arquivo>
 */
import { close } from "@qvac/sdk";
import { buildPassport } from "./pipeline.js";

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
} catch (error) {
  console.error("❌ Erro:", error);
  process.exitCode = 1;
} finally {
  await close();
}
