/**
 * Etapa de OCR: extrai texto de uma imagem de documento, 100% offline.
 * Veja docs/qvac-notes.md (seção OCR).
 */
import { loadModel, ocr, unloadModel } from "@qvac/sdk";
import { OCR_MODEL, OCR_CONFIG } from "./config.js";

/**
 * @param {string} imagePath  caminho do arquivo de imagem (jpg, png, bmp...)
 * @returns {Promise<{ text: string, blocks: Array<{text: string, bbox?: number[], confidence?: number}> }>}
 */
export async function extractText(imagePath) {
  const modelId = await loadModel({
    modelSrc: OCR_MODEL,
    modelType: "ocr",
    modelConfig: OCR_CONFIG,
  });

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
    // libera o modelo mesmo se der erro
    await unloadModel({ modelId, clearStorage: false });
  }
}
