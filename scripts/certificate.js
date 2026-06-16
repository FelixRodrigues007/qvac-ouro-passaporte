/** Generates the HTML certificate from a passport JSON. Detects tampering. */
import { readFileSync, writeFileSync } from "node:fs";
import { verificarSelo } from "../src/seal.js";
import { renderCertificate } from "../src/certificate.js";

const path = process.argv[2];
if (!path) { console.error("Usage: node scripts/certificate.js <arquivo.passport.json>"); process.exit(1); }

const passport = JSON.parse(readFileSync(path, "utf8"));
const { integro } = verificarSelo(passport);
const html = renderCertificate(passport, { seloIntegro: integro });
const out = path.replace(/\.json$/, ".html");
writeFileSync(out, html);
console.log((integro ? "✅ Seal intact" : "⛔ TAMPERED DOCUMENT") + " — certificate saved to: " + out);
