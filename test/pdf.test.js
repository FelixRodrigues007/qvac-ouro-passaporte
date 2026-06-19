/**
 * Tests for the PDF text-layer extractor (src/pdf.js).
 * Pure: builds tiny synthetic PDFs on the fly, no @qvac/sdk involved.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { extractPdfText, isPdf } from "../src/pdf.js";

/** Builds a minimal, valid, uncompressed PDF whose single page renders `content`. */
function buildPdf(content) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((obj, i) => {
    offsets[i] = Buffer.byteLength(pdf, "latin1");
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = Buffer.byteLength(pdf, "latin1");
  pdf += "xref\n0 6\n0000000000 65535 f \n";
  for (const off of offsets) pdf += String(off).padStart(10, "0") + " 00000 n \n";
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

/** Writes a PDF buffer to a temp file and returns its path. */
function writePdf(name, content) {
  const dir = mkdtempSync(join(tmpdir(), "pdf-test-"));
  const path = join(dir, name);
  writeFileSync(path, buildPdf(content));
  return path;
}

test("isPdf detects PDFs by extension, case-insensitive", () => {
  assert.equal(isPdf("a/b/laudo.pdf"), true);
  assert.equal(isPdf("LAUDO.PDF"), true);
  assert.equal(isPdf("foto.jpg"), false);
  assert.equal(isPdf(null), false);
});

test("extractPdfText reads the text layer of a digital PDF", async () => {
  const path = writePdf(
    "digital.pdf",
    "BT /F1 18 Tf 72 720 Td (TEOR OURO 12,4 g/t LOTE ABC-123) Tj ET"
  );
  const { text, blocks } = await extractPdfText(path);
  assert.match(text, /TEOR OURO 12,4 g\/t/);
  assert.match(text, /LOTE ABC-123/);
  assert.equal(blocks[0].page, 1);
});

test("extractPdfText rejects a PDF with no text layer (scanned)", async () => {
  const path = writePdf("scanned.pdf", "q Q"); // draws nothing, no text
  await assert.rejects(extractPdfText(path), /no text layer/i);
});
