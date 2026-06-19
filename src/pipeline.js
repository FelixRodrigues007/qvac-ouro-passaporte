/**
 * Pipeline: document photo -> OCR (offline) -> LLM -> verification -> passport.
 * Also records a structured audit log (model load/unload + inference metrics).
 */
import { extractDocument } from "./extract.js";
import { structureProvenance } from "./structure.js";
import { verificar } from "./verify.js";
import { selar } from "./seal.js";
import { createAudit } from "./audit.js";

// Device specs — edit here. They are recorded in the audit log (out/<id>.audit.json).
const DEVICE = {
  model: "MacBook Pro",
  chip: "Apple M3 Pro",
  ram_gb: 36,
  storage_gb: 512,
  os: "macOS 26.5",
};

/** Turns the batch into a safe id for the file name (or null if empty). */
function sanitizeId(value) {
  if (!value || typeof value !== "string") return null;
  const clean = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return clean || null;
}

export async function buildPassport(docPath, options = {}) {
  const audit = createAudit({ device: DEVICE });

  // Text extraction (OCR for images, text layer for PDFs) is always local;
  // only the LLM extraction may be delegated to a peer.
  const { text, blocks, source } = await extractDocument(docPath, audit);
  const passport = await structureProvenance(text, audit, options.delegate);

  // Average OCR confidence: mean of the blocks with a defined confidence (null if none).
  const confs = (blocks || [])
    .map((b) => b.confidence)
    .filter((c) => typeof c === "number");
  const confiancaMedia = confs.length
    ? confs.reduce((s, c) => s + c, 0) / confs.length
    : null;

  // Deterministic verification (clear rules, not AI).
  const v = verificar(passport, { confiancaMedia });
  passport.verificacao = {
    status_licenca: v.status,
    alertas: v.alertas,
    checagens: v.checagens,
    gerado_em: new Date().toISOString(),
    // The seal covers this field, so it must be honest about where the text was
    // read and where the LLM ran.
    fonte: `${source === "pdf" ? "PDF text layer (offline, on-device)" : "OCR offline (on-device)"} + ${
      options.delegate ? "LLM delegado a peer via P2P (QVAC)" : "LLM local (QVAC)"
    }`,
  };

  // Seals the passport (SHA-256) only after it is complete, including the verification.
  const sealed = selar(passport);

  // Audit log uses the SAME id as the passport.
  const id = sanitizeId(sealed?.origem?.lote) || `passaporte-${Date.now()}`;
  audit.save(`out/${id}.audit.json`);
  console.log("\n" + audit.summary());

  return { rawText: text, passport: sealed, id };
}
