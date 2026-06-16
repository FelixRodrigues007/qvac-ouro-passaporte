/**
 * Pipeline: document photo -> OCR (offline) -> LLM -> verification -> passport.
 */
import { extractText } from "./ocr.js";
import { structureProvenance } from "./structure.js";
import { verificar } from "./verify.js";
import { selar } from "./seal.js";

export async function buildPassport(imagePath) {
  const { text, blocks } = await extractText(imagePath);
  const passport = await structureProvenance(text);

  // Average OCR confidence: mean of the blocks with a defined confidence (null if none).
  const confs = (blocks || [])
    .map((b) => b.confidence)
    .filter((c) => typeof c === "number");
  const confiancaMedia = confs.length
    ? confs.reduce((s, c) => s + c, 0) / confs.length
    : null;

  // Deterministic verification (clear rules, not AI).
  const v = verificar(passport, { confiancaMedia });
  passport.verificacao = {
    status_licenca: v.status,
    alertas: v.alertas,
    checagens: v.checagens,
    gerado_em: new Date().toISOString(),
    fonte: "OCR offline + LLM local (QVAC)",
  };

  // Seals the passport (SHA-256) only after it is complete, including the verification.
  return { rawText: text, passport: selar(passport) };
}
