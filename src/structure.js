/**
 * LLM step: turns the raw OCR text into the "provenance passport" (JSON).
 * Runs locally via QVAC. See docs/provenance-schema.md for the fields.
 */
import { loadModel, completion, unloadModel, getLoadedModelInfo } from "@qvac/sdk";
import { LLM_MODEL } from "./config.js";

const SYSTEM = `/no_think
You extract data from Brazilian mining documents (ANM license/PLG, assay
reports, packing lists) about GOLD. Respond ONLY with a valid JSON object, with no
text before or after, and no comments. Use null when you cannot find the data.
DO NOT make up values.`;

function buildPrompt(rawText) {
  return `Text extracted from the document (via OCR, may contain noise):
"""
${rawText}
"""

Return ONLY this filled-in JSON (same structure):
{
  "documento": { "tipo": null, "numero_processo_anm": null, "data_emissao": null, "validade": null },
  "titular": { "nome": null, "cpf_cnpj": null },
  "area": { "municipio": null, "uf": null, "coordenadas": null, "regime": null },
  "minerio": { "substancia": "ouro", "teor": null, "massa": null, "unidade": null },
  "origem": { "lote": null, "ponto_extracao": null },
  "verificacao": { "status_licenca": "nao_identificado", "observacoes": null }
}

Rules:
- "tipo": one of "licenca_anm", "plg", "laudo_ensaio", "romaneio" or "outro".
- "regime": one of "concessao_lavra", "plg", "autorizacao_pesquisa" or null.
- Dates and numbers as they appear in the document (e.g.: "12,4 g/t").`;
}

export async function structureProvenance(rawText, audit, delegate = null) {
  audit?.modelLoadStart("LLM (Qwen3 4B)");
  let modelId;
  if (delegate) {
    // Delegated: the provider already loaded the model (ctx_size 8192 / temp 0.2),
    // so we don't pass modelConfig — the LLM step runs on the peer's machine.
    modelId = await loadModel({
      modelSrc: LLM_MODEL,
      modelType: "llm",
      delegate: { providerPublicKey: delegate, fallbackToLocal: false },
    });
    audit?.modelLoadEnd("LLM (Qwen3 4B)", { src: LLM_MODEL, delegated: true, provider: delegate });
    const info = await getLoadedModelInfo({ modelId });
    console.log("   isDelegated:", info.isDelegated);
  } else {
    modelId = await loadModel({
      modelSrc: LLM_MODEL,
      modelType: "llm",
      modelConfig: { ctx_size: 8192, temp: 0.2 },
    });
    audit?.modelLoadEnd("LLM (Qwen3 4B)", { src: LLM_MODEL, ctx_size: 8192 });
  }

  try {
    const userPrompt = buildPrompt(rawText);
    const history = [
      { role: "system", content: SYSTEM },
      { role: "user", content: userPrompt },
    ];

    // Measure the inference (TTFT + tokens/sec) on the actual streamed tokens.
    const t = audit?.inferenceStart("LLM (Qwen3 4B)", userPrompt);
    const result = completion({ modelId, history, stream: true });

    let saida = "";
    let first = true;
    for await (const token of result.tokenStream) {
      if (first) { t?.firstToken(); first = false; }
      t?.token();
      saida += token;
    }
    t?.end();

    const passport = safeParseJson(saida);
    // Rebuild the degree symbol the OCR drops on coordinates (charset has no "°").
    if (passport?.area && typeof passport.area === "object") {
      passport.area.coordenadas = normalizeCoordinates(passport.area.coordenadas);
    }
    return passport;
  } finally {
    await unloadModel({ modelId });
    audit?.modelUnload("LLM (Qwen3 4B)");
  }
}

/**
 * Reconstructs the degree symbol that the OCR loses on coordinates. The latin
 * recognizer has no "°" in its charset, so it emits noise (a space, "*", or "9")
 * where the degree sign should be — e.g. "24 30'S 50*24'W" or "24930'S". This
 * rebuilds "24°30′S 50°24′W". Restricted to the coordinates value only: it acts
 * solely on the "DD<noise>MM'<hemisphere>" shape, leaving every other field
 * untouched.
 */
function normalizeCoordinates(value) {
  if (typeof value !== "string") return value;
  return value.replace(
    /(\d{1,2})[°º*9\s]+(\d{2})\s*['´`’′]\s*([NSEW])/gi,
    (_, deg, min, hemi) => `${deg}°${min}′${hemi.toUpperCase()}`
  );
}

/** Extracts the JSON, stripping reasoning (<think>) and code fences. */
function safeParseJson(text) {
  let t = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```json/gi, "")
    .replace(/```/g, "");
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1) return { _erro: "no JSON", _bruto: text };
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    return { _erro: "invalid JSON", _bruto: text };
  }
}
