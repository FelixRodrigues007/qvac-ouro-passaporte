/**
 * Configuração central de modelos.
 * As constantes vêm do registro de modelos da QVAC (download/cache automáticos).
 * Veja docs/qvac-notes.md.
 */
import { QWEN3_4B_INST_Q4_K_M, OCR_LATIN_RECOGNIZER_1 } from "@qvac/sdk";

// Modelo de linguagem usado para estruturar o texto do OCR.
// Para mais qualidade, dá para trocar por um modelo maior do registro (mais lento).
export const LLM_MODEL = QWEN3_4B_INST_Q4_K_M;

// Modelo de OCR (script latino — lê português).
export const OCR_MODEL = OCR_LATIN_RECOGNIZER_1;

// Config do OCR. Ajustar conforme os documentos reais.
export const OCR_CONFIG = {
  langList: ["en"], // recognizer latino lê PT; testar ["pt"] e conferir doc
  useGPU: true,
  timeout: 30000,
  magRatio: 1.5,
  defaultRotationAngles: [90, 180, 270], // tenta corrigir documentos rotacionados
  contrastRetry: false,
  lowConfidenceThreshold: 0.5,
  recognizerBatchSize: 1,
};
