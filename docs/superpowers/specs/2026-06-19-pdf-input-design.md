# Design — Accept digital (text-layer) PDFs as input

Date: 2026-06-19
Status: approved (pending spec review)

## Problem

The pipeline only accepts images: `ocr.js` feeds the file path to QVAC's `ocr()`,
and the verified cheatsheet (`docs/qvac-notes.md`) confirms `ocr()` takes an
**image** (path or buffer) only — there is no PDF support in `@qvac/sdk`. Many real
gold documents (ANM process records, assay reports, invoices) arrive as PDFs, not
photos, so the tool cannot ingest them today.

## Scope

**IN:** digital PDFs that carry a **text layer** (electronically generated). Extract
the text layer directly — no OCR — which is both higher fidelity than OCR and
trivially offline.

**OUT (explicit):**
- Scanned/image-only PDFs (need rasterization → a heavier native/canvas dependency).
- Multi-file batch input.
- Page-range selection.

The scanned-PDF case is deferred to a future hybrid (try text layer first, fall back
to rasterize + OCR). This design only leaves a clean seam for it.

## Decisions

- **Library:** `pdfjs-dist` (Mozilla PDF.js) — pure JS, fully offline, no native
  binary, reference implementation. Adds one dependency (the project's "single
  dependency" principle is relaxed to the minimum viable; still offline-first).
- Use the **legacy ESM build** with the worker disabled (Node, no DOM/worker).

## Architecture

The PDF extractor returns the **same contract** as `ocr.js` (`{ text, blocks }`), so
everything downstream (`structure.js`, `verify.js`, `seal.js`) is unchanged.

### Components

1. **`src/pdf.js` (new)**
   - `export async function extractPdfText(pdfPath, audit)`:
     - Read the file as a `Uint8Array`; load via `pdfjs-dist` legacy build with the
       worker disabled.
     - Iterate pages; for each, join the `item.str` values from `getTextContent()`.
       Join pages with `\n`.
     - Return `{ text, blocks }` where `blocks = [{ text: <page text>, page: n }]`
       (no `confidence`, no `bbox`).
     - **Scanned detection:** if the trimmed text has fewer than `PDF_MIN_TEXT_CHARS`
       non-space characters, throw a clear, typed error: PDF has no text layer
       (likely scanned); scanned-PDF support is not implemented yet — export/scan to
       an image instead.
     - Time the parse via `audit?.modelLoadStart("PDF text layer")` /
       `audit?.modelLoadEnd("PDF text layer")` — reuses the existing audit API; no
       change to `audit.js`.
   - `export function isPdf(path)`: pure helper, lowercased `.pdf` extension check.
     Imports no SDK, so it is unit-testable in isolation.

2. **`src/extract.js` (new)** — thin dispatcher.
   - `export async function extractDocument(path, audit)`: routes by extension —
     `isPdf(path)` → `extractPdfText`; otherwise → `extractText` (existing OCR).
   - Returns `{ text, blocks, source: "pdf" | "ocr" }`.

3. **`src/pipeline.js`** — one-line swap: call `extractDocument(path, audit)` instead
   of `extractText`. Use `source` to keep the `fonte` field honest:
   - `"pdf"` → `"PDF text layer (offline, on-device) + LLM ..."`
   - `"ocr"` → existing string.
   - Combine with the existing delegate variants.
   - The `confiancaMedia` calc already yields `null` when no block has a confidence
     (PDF case), and `verify.js` check #7 already skips when confidence is `null`. No
     false low-confidence alert. No other change.

4. **`src/index.js`** — generic wording: usage string + log line ("📄 Reading
   document (offline)" instead of "📷"). Rename the local `imagePath` → `docPath`.
   `--delegate` untouched.

5. **`src/config.js`** — `export const PDF_MIN_TEXT_CHARS = 10;` (documents the
   "looks scanned" threshold).

6. **`package.json`** — add `pdfjs-dist` to dependencies.

### Data flow

```
docPath
  -> extractDocument(path, audit)
       -> isPdf? extractPdfText : extractText (OCR)
  -> { text, blocks, source }
  -> structureProvenance(text)        (LLM, unchanged)
  -> verificar(passport, {confiancaMedia})   (null for PDF -> no OCR-confidence alert)
  -> selar(passport)
  -> save out/<id>.passport.json + audit
```

## Error handling

- **Scanned PDF (no text layer):** typed error with a clear, actionable message;
  CLI exits non-zero.
- **Corrupt/unreadable PDF:** wrap the pdfjs failure in a friendly message.
- **Image input:** unchanged behavior.

## Testing

`node --test test/*.test.js`, pure (no `@qvac/sdk` load), per the existing
`verify.test.js` style. New `test/pdf.test.js` with synthetic fixtures committed
under `test/fixtures/` (self-contained, offline):

1. **Digital PDF with known text** → `extractPdfText` returns text containing the
   known string; `blocks[0].page === 1`.
2. **Valid PDF without a text layer** → `extractPdfText` throws the "no text layer"
   error.
3. **`isPdf()`** → unit test: `.pdf`, `.PDF` true; `.jpg` false.

The dispatcher's OCR branch is not unit-tested (it would require the SDK); it is
covered by manual/smoke runs. `extractPdfText` and `isPdf` import no SDK and are
tested directly.

## Out of scope / future

Scanned-PDF support via rasterization (page → image → QVAC OCR), wired as a fallback
inside `extractDocument` when `extractPdfText` reports no text layer. Not built now.
```
