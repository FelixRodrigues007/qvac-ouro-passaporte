/**
 * Pipeline: foto do documento -> OCR (offline) -> LLM -> verificação -> passaporte.
 */
import { extractText } from "./ocr.js";
import { structureProvenance } from "./structure.js";
import { verificar } from "./verify.js";

export async function buildPassport(imagePath) {
  const { text } = await extractText(imagePath);
  const passport = await structureProvenance(text);

  // Verificação determinística (regras claras, não IA).
  const v = verificar(passport);
  passport.verificacao = {
    status_licenca: v.status,
    alertas: v.alertas,
    checagens: v.checagens,
    gerado_em: new Date().toISOString(),
    fonte: "OCR offline + LLM local (QVAC)",
  };

  return { rawText: text, passport };
}
