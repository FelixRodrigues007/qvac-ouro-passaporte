/**
 * Dev helper: builds a digital PDF (real text layer) from a UTF-8 text file.
 * Used to create a text-layer PDF test fixture from the laudo's OCR text, so the
 * PDF input path can be exercised end-to-end (a PNG->PDF conversion would be
 * image-only and has no text layer).
 *
 *   node scripts/build-text-pdf.mjs <input.txt> <output.pdf>
 */
import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("Usage: node scripts/build-text-pdf.mjs <input.txt> <output.pdf>");
  process.exit(1);
}

const lines = readFileSync(inPath, "utf8").replace(/\r/g, "").split("\n");
const esc = (s) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

// One BT/ET block; first line positioned with Td, the rest via T* (uses leading TL).
let content = "BT /F1 10 Tf 14 TL 50 760 Td\n";
lines.forEach((ln, i) => {
  content += (i === 0 ? "" : "T* ") + `(${esc(ln)}) Tj\n`;
});
content += "ET";

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

writeFileSync(outPath, Buffer.from(pdf, "latin1"));
console.log(`wrote ${outPath} (${lines.length} lines)`);
