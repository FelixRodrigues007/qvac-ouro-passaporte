/**
 * Verificação determinística do passaporte (regras claras, não IA).
 * A IA extrai os dados; aqui o código julga se a documentação parece
 * válida, vencida ou incompleta — de forma auditável e explicável.
 */

/** Converte data "DD/MM/AAAA" (ou variações) em Date, ou null. */
function parseDataBR(s) {
  if (!s || typeof s !== "string") return null;
  const m = s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (!m) return null;
  let d = parseInt(m[1], 10);
  let mo = parseInt(m[2], 10);
  let y = parseInt(m[3], 10);
  if (y < 100) y += 2000;
  const dt = new Date(y, mo - 1, d);
  return isNaN(dt.getTime()) ? null : dt;
}

function temValor(v) {
  return v !== null && v !== undefined && String(v).trim() !== "";
}

/**
 * Recebe o passaporte com os dados extraídos e devolve a verificação.
 * @param {object} p  passaporte
 * @param {Date} hoje data de referência (padrão: agora)
 * @returns {{ status: string, alertas: number, checagens: string[] }}
 */
export function verificar(p, hoje = new Date()) {
  const checagens = [];
  let alertas = 0;

  // 1) Validade
  const validadeStr = p?.documento?.validade;
  const validade = parseDataBR(validadeStr);
  let vencida = null;
  if (validade) {
    vencida = validade < hoje;
    if (vencida) {
      checagens.push(`⚠️ Documento vencido (validade ${validadeStr})`);
      alertas++;
    } else {
      checagens.push(`✓ Documento vigente (validade ${validadeStr})`);
    }
  } else {
    checagens.push("⚠️ Validade não identificada");
    alertas++;
  }

  // 2) Processo ANM
  if (temValor(p?.documento?.numero_processo_anm)) {
    checagens.push(`✓ Processo ANM informado (${p.documento.numero_processo_anm})`);
  } else {
    checagens.push("⚠️ Sem número de processo ANM");
    alertas++;
  }

  // 3) Regime de extração
  if (temValor(p?.area?.regime)) {
    checagens.push(`✓ Regime informado (${p.area.regime})`);
  } else {
    checagens.push("⚠️ Regime de extração não identificado");
    alertas++;
  }

  // 4) Titular
  if (temValor(p?.titular?.nome)) {
    checagens.push("✓ Titular informado");
  } else {
    checagens.push("⚠️ Titular não identificado");
    alertas++;
  }

  // Status final
  let status;
  if (vencida === true) status = "vencida";
  else if (alertas === 0) status = "valida";
  else if (alertas <= 2) status = "atencao";
  else status = "incompleta";

  return { status, alertas, checagens };
}
