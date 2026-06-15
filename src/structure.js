/**
 * Etapa do LLM: transforma o texto cru do OCR no "passaporte de procedência" (JSON).
 * Roda local via QVAC. Veja docs/provenance-schema.md para os campos.
 */
import { loadModel, completion, unloadModel } from "@qvac/sdk";
import { LLM_MODEL } from "./config.js";

const SYSTEM = `/no_think
Você extrai dados de documentos minerários brasileiros (licença/PLG da ANM, laudos
de ensaio, romaneios) sobre OURO. Responda APENAS com um objeto JSON válido, sem
texto antes ou depois, sem comentários. Use null quando não encontrar o dado.
NÃO invente valores.`;

function buildPrompt(rawText) {
  return `Texto extraído do documento (via OCR, pode ter ruído):
"""
${rawText}
"""

Devolva SOMENTE este JSON preenchido (mesma estrutura):
{
  "documento": { "tipo": null, "numero_processo_anm": null, "data_emissao": null, "validade": null },
  "titular": { "nome": null, "cpf_cnpj": null },
  "area": { "municipio": null, "uf": null, "coordenadas": null, "regime": null },
  "minerio": { "substancia": "ouro", "teor": null, "massa": null, "unidade": null },
  "origem": { "lote": null, "ponto_extracao": null },
  "verificacao": { "status_licenca": "nao_identificado", "observacoes": null }
}

Regras:
- "tipo": um de "licenca_anm", "plg", "laudo_ensaio", "romaneio" ou "outro".
- "regime": um de "concessao_lavra", "plg", "autorizacao_pesquisa" ou null.
- Datas e números como aparecem no documento (ex.: "12,4 g/t").`;
}

export async function structureProvenance(rawText) {
  const modelId = await loadModel({
    modelSrc: LLM_MODEL,
    modelType: "llm",
    modelConfig: { ctx_size: 8192, temp: 0.2 },
  });

  try {
    const history = [
      { role: "system", content: SYSTEM },
      { role: "user", content: buildPrompt(rawText) },
    ];
    const result = completion({ modelId, history, stream: true });

    let saida = "";
    for await (const token of result.tokenStream) saida += token;

    return safeParseJson(saida);
  } finally {
    await unloadModel({ modelId });
  }
}

/** Extrai o JSON, removendo raciocínio (<think>) e cercas de código. */
function safeParseJson(text) {
  let t = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```json/gi, "")
    .replace(/```/g, "");
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1) return { _erro: "sem JSON", _bruto: text };
  try {
    return JSON.parse(t.slice(start, end + 1));
  } catch {
    return { _erro: "JSON inválido", _bruto: text };
  }
}
