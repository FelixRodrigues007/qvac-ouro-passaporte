/**
 * Central model configuration.
 * The constants come from the QVAC model registry (automatic download/cache).
 * See docs/qvac-notes.md.
 */
import { QWEN3_4B_INST_Q4_K_M, OCR_LATIN_RECOGNIZER_1 } from "@qvac/sdk";

// Language model used to structure the OCR text.
// For higher quality, you can swap it for a larger model from the registry (slower).
export const LLM_MODEL = QWEN3_4B_INST_Q4_K_M;

// OCR model (Latin script — reads Portuguese).
export const OCR_MODEL = OCR_LATIN_RECOGNIZER_1;

// Below this many non-space characters, a PDF is treated as having no text layer
// (i.e. a scanned/image PDF) instead of a digital one. See src/pdf.js.
export const PDF_MIN_TEXT_CHARS = 10;

// OCR config. Adjust according to the real documents.
export const OCR_CONFIG = {
  langList: ["en"], // Latin recognizer reads PT; test ["pt"] and check the docs
  useGPU: true,
  timeout: 30000,
  magRatio: 1.5,
  defaultRotationAngles: [90, 180, 270], // tries to fix rotated documents
  contrastRetry: false,
  lowConfidenceThreshold: 0.5,
  recognizerBatchSize: 1,
};
