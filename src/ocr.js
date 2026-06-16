/**
 * OCR step: extracts text from a document image, 100% offline.
 * See docs/qvac-notes.md (OCR section).
 */
import { loadModel, ocr, unloadModel } from "@qvac/sdk";
import { OCR_MODEL, OCR_CONFIG } from "./config.js";

/**
 * @param {string} imagePath  path to the image file (jpg, png, bmp...)
 * @param {object} [audit]     optional audit log (createAudit) to record load/unload
 * @returns {Promise<{ text: string, blocks: Array<{text: string, bbox?: number[], confidence?: number}> }>}
 */
export async function extractText(imagePath, audit) {
  audit?.modelLoadStart("OCR (ONNX)");
  const modelId = await loadModel({
    modelSrc: OCR_MODEL,
    modelType: "ocr",
    modelConfig: OCR_CONFIG,
  });
  audit?.modelLoadEnd("OCR (ONNX)");

  try {
    const { blocks } = ocr({
      modelId,
      image: imagePath,
      options: { paragraph: false },
    });
    const result = await blocks; // [{ text, bbox?, confidence? }, ...]
    const text = result.map((b) => b.text).join("\n");
    return { text, blocks: result };
  } finally {
    // releases the model even if an error occurs
    await unloadModel({ modelId, clearStorage: false });
    audit?.modelUnload("OCR (ONNX)");
  }
}
