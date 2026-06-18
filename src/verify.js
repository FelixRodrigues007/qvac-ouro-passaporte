/**
 * Deterministic verification of the passport (clear rules, not AI).
 * The AI extracts the data; here the code judges whether the documentation looks
 * valid, expired or incomplete — in an auditable and explainable way.
 */

/** Converts a date "DD/MM/YYYY" (or variations) into a Date, or null. */
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

// Parses a gold grade string into grams per tonne, or null if absent / not a
// g/t-style figure. Only g/t and ppm are gram-per-tonne equivalents (1 ppm Au =
// 1 g/t). Handles Brazilian numbers ("1.289,05" -> 1289.05, "12,4" -> 12.4) while
// leaving plain decimals ("0.35") intact, so a low grade is never misread as high.
function parseTeorGt(teor) {
  if (!teor || typeof teor !== "string") return null;
  if (!/g\s*\/\s*t|ppm/i.test(teor)) return null;
  let s = teor.match(/[\d.,]+/)?.[0];
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", "."); // dots = thousands
  const num = parseFloat(s);
  return Number.isNaN(num) ? null : num;
}

// Economic gold is typically ~1–10 g/t; world-class bonanza grades rarely exceed
// a few tens of g/t. A reported grade far above this is a strong fraud/typo signal.
const TEOR_OURO_MAX_PLAUSIVEL_GT = 50;

// CNPJ/CPF validation via check digit (auditable, without relying on AI).
function soDigitos(s){return String(s||'').replace(/\D/g,'');}
function validarCNPJ(v){const c=soDigitos(v);if(c.length!==14||/^(\d)\1{13}$/.test(c))return false;const dv=(b,p)=>{const r=b.reduce((s,n,i)=>s+n*p[i],0)%11;return r<2?0:11-r;};const n=c.split('').map(Number);return dv(n.slice(0,12),[5,4,3,2,9,8,7,6,5,4,3,2])===n[12]&&dv(n.slice(0,13),[6,5,4,3,2,9,8,7,6,5,4,3,2])===n[13];}
function validarCPF(v){const c=soDigitos(v);if(c.length!==11||/^(\d)\1{10}$/.test(c))return false;const dv=q=>{let s=0;for(let i=0;i<q;i++)s+=Number(c[i])*(q+1-i);const r=(s*10)%11;return r===10?0:r;};return dv(9)===Number(c[9])&&dv(10)===Number(c[10]);}

/**
 * Receives the passport with the extracted data and returns the verification.
 * @param {object} p  passport
 * @param {object} opcoes
 * @param {Date}   [opcoes.hoje]           reference date (default: now)
 * @param {number|null} [opcoes.confiancaMedia] average OCR confidence (0..1) or null
 * @returns {{ status: string, alertas: number, checagens: string[] }}
 */
export function verificar(p, opcoes = {}) {
  const { hoje = new Date(), confiancaMedia = null } = opcoes;
  const checagens = [];
  let alertas = 0;

  // 1) Expiry date
  const validadeStr = p?.documento?.validade;
  const validade = parseDataBR(validadeStr);
  let vencida = null;
  if (validade) {
    vencida = validade < hoje;
    if (vencida) {
      checagens.push(`⚠️ Document expired (valid until ${validadeStr})`);
      alertas++;
    } else {
      checagens.push(`✓ Document valid (expires ${validadeStr})`);
    }
  } else {
    checagens.push("⚠️ Expiry date not identified");
    alertas++;
  }

  // 2) ANM process
  if (temValor(p?.documento?.numero_processo_anm)) {
    checagens.push(`✓ ANM process present (${p.documento.numero_processo_anm})`);
  } else {
    checagens.push("⚠️ No ANM process number");
    alertas++;
  }

  // 3) Mining regime
  if (temValor(p?.area?.regime)) {
    checagens.push(`✓ Mining regime present (${p.area.regime})`);
  } else {
    checagens.push("⚠️ Mining regime not identified");
    alertas++;
  }

  // 4) Holder
  if (temValor(p?.titular?.nome)) {
    checagens.push("✓ Holder present");
  } else {
    checagens.push("⚠️ Holder not identified");
    alertas++;
  }

  // 5) Holder's CNPJ/CPF — validate via check digit
  const docTitular = p?.titular?.cpf_cnpj;
  if (temValor(docTitular)) {
    const digitos = soDigitos(docTitular);
    const valido =
      digitos.length === 14 ? validarCNPJ(docTitular)
      : digitos.length === 11 ? validarCPF(docTitular)
      : false;
    if (valido) {
      checagens.push("✓ Tax ID (CNPJ/CPF) valid");
    } else {
      checagens.push("⚠️ Tax ID (CNPJ/CPF) failed check-digit validation");
      alertas++;
    }
  } else {
    checagens.push("⚠️ Tax ID (CNPJ/CPF) not provided");
    alertas++;
  }

  // 6) Date consistency — issue date cannot be after the expiry date
  const emissao = parseDataBR(p?.documento?.data_emissao);
  if (emissao && validade && emissao > validade) {
    checagens.push("⚠️ Issue date is after the expiry date");
    alertas++;
  }

  // 7) OCR confidence — a poor reading deserves manual review
  if (confiancaMedia != null && confiancaMedia < 0.7) {
    checagens.push(
      `⚠️ Low-confidence OCR reading (average ${confiancaMedia.toFixed(2)}) — review fields`
    );
    alertas++;
  }

  // 8) Gold grade sanity — an implausibly high grade signals fraud or a typo
  // (the famous "80 g/t average / 1.289 g/t" claims of fabricated reports).
  const teorGt = parseTeorGt(p?.minerio?.teor);
  if (teorGt != null && teorGt > TEOR_OURO_MAX_PLAUSIVEL_GT) {
    checagens.push(
      `⚠️ Implausible gold grade (${p.minerio.teor}) — above ${TEOR_OURO_MAX_PLAUSIVEL_GT} g/t; likely fraud/typo, review`
    );
    alertas++;
  }

  // Final status
  let status;
  if (vencida === true) status = "vencida";
  else if (alertas === 0) status = "valida";
  else if (alertas <= 2) status = "atencao";
  else status = "incompleta";

  return { status, alertas, checagens };
}
