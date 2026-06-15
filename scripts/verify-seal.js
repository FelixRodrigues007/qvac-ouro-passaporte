/**
 * Verifica o selo criptográfico de um passaporte já salvo.
 * Uso: npm run verify-seal -- ./out/<id>.passport.json
 */
import { readFileSync } from "node:fs";
import { verificarSelo } from "../src/seal.js";

const caminho = process.argv[2];
if (!caminho) {
  console.error("Uso: node scripts/verify-seal.js <arquivo.passport.json>");
  process.exit(1);
}

const passaporte = JSON.parse(readFileSync(caminho, "utf8"));
const r = verificarSelo(passaporte);

if (r.integro) {
  console.log("✅ Selo íntegro");
} else {
  console.log("⛔ DOCUMENTO ADULTERADO");
}
console.log("  esperado: " + r.esperado);
console.log("  atual:    " + r.atual);

process.exitCode = r.integro ? 0 : 1;
