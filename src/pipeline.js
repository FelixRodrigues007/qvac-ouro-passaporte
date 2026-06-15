/**
 * Pipeline: foto do documento -> OCR (offline) -> LLM -> verificação -> passaporte.
 */
import { extractText } from "./ocr.js";
import { structureProvenance } from "./structure.js";
import { verificar } from "./verify.js";
import { selar } from "./seal.js";

export async function buildPassport(imagePath) {
  const { text, blocks } = await extractText(imagePath);
  const passport = await structureProvenance(text);

  // Confiança média do OCR: média dos blocks com confidence definido (null se nenhum).
  const confs = (blocks || [])
    .map((b) => b.confidence)
    .filter((c) => typeof c === "number");
  const confiancaMedia = confs.length
    ? confs.reduce((s, c) => s + c, 0) / confs.length
    : null;

  // Verificação determinística (regras claras, não IA).
  const v = verificar(passport, { confiancaMedia });
  passport.verificacao = {
    status_licenca: v.status,
    alertas: v.alertas,
    checagens: v.checagens,
    gerado_em: new Date().toISOString(),
    fonte: "OCR offline + LLM local (QVAC)",
  };

  // Sela o passaporte (SHA-256) só depois de completo, incluindo a verificação.
  return { rawText: text, passport: selar(passport) };
}
