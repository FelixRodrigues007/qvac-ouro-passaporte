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

// Validação de CNPJ/CPF pelo dígito verificador (auditável, sem depender de IA).
function soDigitos(s){return String(s||'').replace(/\D/g,'');}
function validarCNPJ(v){const c=soDigitos(v);if(c.length!==14||/^(\d)\1{13}$/.test(c))return false;const dv=(b,p)=>{const r=b.reduce((s,n,i)=>s+n*p[i],0)%11;return r<2?0:11-r;};const n=c.split('').map(Number);return dv(n.slice(0,12),[5,4,3,2,9,8,7,6,5,4,3,2])===n[12]&&dv(n.slice(0,13),[6,5,4,3,2,9,8,7,6,5,4,3,2])===n[13];}
function validarCPF(v){const c=soDigitos(v);if(c.length!==11||/^(\d)\1{10}$/.test(c))return false;const dv=q=>{let s=0;for(let i=0;i<q;i++)s+=Number(c[i])*(q+1-i);const r=(s*10)%11;return r===10?0:r;};return dv(9)===Number(c[9])&&dv(10)===Number(c[10]);}

/**
 * Recebe o passaporte com os dados extraídos e devolve a verificação.
 * @param {object} p  passaporte
 * @param {object} opcoes
 * @param {Date}   [opcoes.hoje]           data de referência (padrão: agora)
 * @param {number|null} [opcoes.confiancaMedia] confiança média do OCR (0..1) ou null
 * @returns {{ status: string, alertas: number, checagens: string[] }}
 */
export function verificar(p, opcoes = {}) {
  const { hoje = new Date(), confiancaMedia = null } = opcoes;
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

  // 5) CNPJ/CPF do titular — valida pelo dígito verificador
  const docTitular = p?.titular?.cpf_cnpj;
  if (temValor(docTitular)) {
    const digitos = soDigitos(docTitular);
    const valido =
      digitos.length === 14 ? validarCNPJ(docTitular)
      : digitos.length === 11 ? validarCPF(docTitular)
      : false;
    if (valido) {
      checagens.push("✓ CNPJ/CPF válido");
    } else {
      checagens.push("⚠️ CNPJ/CPF com dígito verificador inválido");
      alertas++;
    }
  } else {
    checagens.push("⚠️ CNPJ/CPF não informado");
    alertas++;
  }

  // 6) Coerência de datas — emissão não pode ser posterior à validade
  const emissao = parseDataBR(p?.documento?.data_emissao);
  if (emissao && validade && emissao > validade) {
    checagens.push("⚠️ Data de emissão posterior à validade");
    alertas++;
  }

  // 7) Confiança do OCR — leitura ruim merece revisão manual
  if (confiancaMedia != null && confiancaMedia < 0.7) {
    checagens.push(
      `⚠️ Leitura OCR com baixa confiança (média ${confiancaMedia.toFixed(2)}) — revisar campos`
    );
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
