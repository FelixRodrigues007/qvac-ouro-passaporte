/**
 * Document dispatcher: routes a file to the right extractor by type.
 *  - PDF (digital, text layer) -> extractPdfText (no OCR, offline)
 *  - image (jpg/png/...)       -> extractText (offline OCR via QVAC)
 * Both return { text, blocks }; this adds `source` so the pipeline can be honest
 * about where the text came from.
 */
import { extractText } from "./ocr.js";
import { extractPdfText, isPdf } from "./pdf.js";

/**
 * @param {string} path    path to the document (image or PDF)
 * @param {object} [audit] optional audit log
 * @returns {Promise<{ text: string, blocks: Array, source: "pdf" | "ocr" }>}
 */
export async function extractDocument(path, audit) {
  if (isPdf(path)) {
    const { text, blocks } = await extractPdfText(path, audit);
    return { text, blocks, source: "pdf" };
  }
  const { text, blocks } = await extractText(path, audit);
  return { text, blocks, source: "ocr" };
}
