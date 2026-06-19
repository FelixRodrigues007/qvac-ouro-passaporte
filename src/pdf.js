/**
 * PDF step: extracts the text layer from a digital (electronically generated)
 * PDF, 100% offline, with no OCR. Returns the SAME shape as ocr.js
 * ({ text, blocks }) so the rest of the pipeline is unchanged.
 *
 * Scanned/image-only PDFs have no text layer — those are detected and rejected
 * with a clear message (rasterization + OCR is a future enhancement).
 */
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { PDF_MIN_TEXT_CHARS } from "./config.js";

/** True if the path looks like a PDF (by extension). Pure — imports no SDK. */
export function isPdf(path) {
  return typeof path === "string" && extname(path).toLowerCase() === ".pdf";
}

/**
 * @param {string} pdfPath  path to a digital PDF (with a text layer)
 * @param {object} [audit]  optional audit log (createAudit) to time the parse
 * @returns {Promise<{ text: string, blocks: Array<{text: string, page: number}> }>}
 */
export async function extractPdfText(pdfPath, audit) {
  audit?.modelLoadStart("PDF text layer");
  // Legacy ESM build runs in Node with no worker/canvas: we only read the text
  // layer (getTextContent), never render pages.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(await readFile(pdfPath));

  const loadingTask = pdfjs.getDocument({ data, isEvalSupported: false, useSystemFonts: true });
  let doc;
  try {
    doc = await loadingTask.promise;
  } catch (cause) {
    audit?.modelUnload("PDF text layer");
    throw new Error(`Could not read PDF "${pdfPath}": ${cause.message}`, { cause });
  }
  audit?.modelLoadEnd("PDF text layer", { src: pdfPath, pages: doc.numPages });

  try {
    const blocks = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const content = await (await doc.getPage(n)).getTextContent();
      // Rebuild line breaks: hasEOL marks the end of a text line in the PDF.
      let pageText = "";
      for (const item of content.items) {
        pageText += item.str;
        pageText += item.hasEOL ? "\n" : " ";
      }
      blocks.push({ text: pageText.trim(), page: n });
    }
    const text = blocks.map((b) => b.text).join("\n");

    // A digital PDF yields real text; an (almost) empty result means there is no
    // text layer — i.e. a scanned/image PDF, which we don't OCR yet.
    if (text.replace(/\s/g, "").length < PDF_MIN_TEXT_CHARS) {
      throw new Error(
        `PDF "${pdfPath}" has no text layer (likely scanned). ` +
          "Scanned-PDF support is not implemented yet — export/scan it to an image."
      );
    }
    return { text, blocks };
  } finally {
    await loadingTask.destroy();
    audit?.modelUnload("PDF text layer");
  }
}
