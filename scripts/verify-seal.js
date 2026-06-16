/**
 * Verifies the cryptographic seal of an already-saved passport.
 * Usage: npm run verify-seal -- ./out/<id>.passport.json
 */
import { readFileSync } from "node:fs";
import { verificarSelo } from "../src/seal.js";

const caminho = process.argv[2];
if (!caminho) {
  console.error("Usage: node scripts/verify-seal.js <arquivo.passport.json>");
  process.exit(1);
}

const passaporte = JSON.parse(readFileSync(caminho, "utf8"));
const r = verificarSelo(passaporte);

if (r.integro) {
  console.log("✅ Seal intact");
} else {
  console.log("⛔ TAMPERED DOCUMENT");
}
console.log("  expected: " + r.esperado);
console.log("  current:  " + r.atual);

process.exitCode = r.integro ? 0 : 1;
