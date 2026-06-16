/**
 * Renders the passport as an HTML certificate (security-document style).
 * Pure Node/JS — does not import anything from QVAC.
 *   renderCertificate(passaporte, { seloIntegro })  ->  HTML string
 * If seloIntegro === false, the certificate is rendered with the "TAMPERED" stamp.
 */

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}
function ou(v) {
  return v == null || String(v).trim() === "" ? "—" : esc(v);
}

const STATUS = {
  valida: { label: "VALID", cor: "#1f7a53", bg: "#e7f1ea" },
  atencao: { label: "ATTENTION", cor: "#b6791f", bg: "#f7efdd" },
  vencida: { label: "EXPIRED", cor: "#9e2b2b", bg: "#f6e7e7" },
  incompleta: { label: "INCOMPLETE", cor: "#b6791f", bg: "#f7efdd" },
  nao_identificado: { label: "NOT IDENTIFIED", cor: "#5b6b63", bg: "#eef0ed" },
};

export function renderCertificate(p, opcoes = {}) {
  const seloIntegro = opcoes.seloIntegro !== false;
  const v = p.verificacao || {};
  let st = STATUS[v.status_licenca] || STATUS.nao_identificado;
  const adulterado = !seloIntegro;
  if (adulterado) st = { label: "TAMPERED", cor: "#9e2b2b", bg: "#f6e7e7" };

  const doc = p.documento || {},
    tit = p.titular || {},
    ar = p.area || {},
    min = p.minerio || {},
    org = p.origem || {},
    selo = p.selo || {};

  const massa = [min.massa, min.unidade].filter((x) => x != null && String(x).trim() !== "").join(" ");
  const regime = ar.regime ? String(ar.regime).toUpperCase() : "";
  const substancia = min.substancia
    ? (String(min.substancia).trim().toLowerCase() === "ouro"
        ? "Gold"
        : String(min.substancia).replace(/^\w/, (m) => m.toUpperCase()))
    : "—";

  const checagens = (v.checagens || [])
    .map((c) => {
      const s = String(c).trim();
      const ok = s.startsWith("✓");
      const texto = esc(s.replace(/^✓\s?/, "").replace(/^⚠️\s?/, ""));
      return `<div class="check ${ok ? "ok" : "warn"}"><span class="check__mark">${ok ? "✓" : "⚠"}</span>${texto}</div>`;
    })
    .join("\n        ");

  const dataGerado = selo.gerado_em
    ? new Date(selo.gerado_em).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })
    : "—";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Provenance Passport — ${ou(org.lote)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:ital,wght@0,500;0,600;1,400&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{--ink:#12241d;--ink-soft:#33483f;--paper:#f6f2e8;--paper-edge:#efe9d8;
    --gold:#b8891f;--rule:rgba(18,36,29,.16);--rule-strong:rgba(18,36,29,.34);
    --st:${st.cor};--st-bg:${st.bg};}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:"IBM Plex Sans",system-ui,sans-serif;
    background:radial-gradient(120% 80% at 50% -10%,#1c352b 0%,#12241d 55%,#0c1813 100%);
    color:var(--ink);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px;}
  .doc{width:100%;max-width:760px;background:linear-gradient(180deg,var(--paper),var(--paper-edge));
    border:1px solid var(--gold);box-shadow:0 30px 70px rgba(0,0,0,.45);position:relative;overflow:hidden;}
  .doc::after{content:"";position:absolute;inset:10px;border:1px solid var(--rule);pointer-events:none;}
  .doc__inner{padding:42px 48px 36px;position:relative;z-index:1}
  ${adulterado ? `.stamp{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:3;pointer-events:none}
  .stamp span{border:5px solid #9e2b2b;color:#9e2b2b;font-family:"IBM Plex Serif",serif;font-weight:600;
    font-size:46px;letter-spacing:.08em;padding:10px 34px;transform:rotate(-16deg);opacity:.82;border-radius:6px;
    text-transform:uppercase;background:rgba(246,231,231,.35)}` : ""}
  .head{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding-bottom:20px;border-bottom:1.5px solid var(--rule-strong)}
  .eyebrow{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);font-weight:600}
  .title{font-family:"IBM Plex Serif",serif;font-weight:600;font-size:30px;line-height:1.05;margin-top:8px;letter-spacing:-.01em}
  .title small{display:block;font-size:13px;font-weight:400;font-style:italic;color:var(--ink-soft);margin-top:6px}
  .status{flex-shrink:0;text-align:center;border:1px solid var(--st);background:var(--st-bg);padding:10px 16px;min-width:118px}
  .status__dot{width:8px;height:8px;border-radius:50%;background:var(--st);display:inline-block;margin-right:7px;vertical-align:middle}
  .status__label{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-soft)}
  .status__value{font-family:"IBM Plex Serif",serif;font-weight:600;font-size:17px;color:var(--st);margin-top:2px}
  .lot{display:flex;align-items:baseline;gap:14px;margin:22px 0 6px}
  .lot__k{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-soft)}
  .lot__v{font-family:"IBM Plex Mono",monospace;font-size:22px;font-weight:500;letter-spacing:.02em}
  .substance{font-family:"IBM Plex Serif",serif;font-size:15px;color:var(--gold);font-weight:600;margin-left:auto}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:0 40px;margin-top:18px}
  .field{padding:13px 0;border-bottom:1px solid var(--rule);display:flex;justify-content:space-between;align-items:baseline;gap:16px}
  .field__k{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-soft);white-space:nowrap}
  .field__v{font-family:"IBM Plex Mono",monospace;font-size:13.5px;text-align:right;font-weight:500}
  .verify{margin-top:26px;background:var(--st-bg);border-left:3px solid var(--st);padding:16px 20px}
  .verify__h{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-soft);margin-bottom:10px}
  .check{display:flex;align-items:center;gap:9px;font-size:13px;padding:3px 0}
  .check.ok .check__mark{color:#1f7a53;font-weight:700}
  .check.warn .check__mark{color:#b6791f;font-weight:700}
  .foot{display:flex;gap:26px;align-items:center;margin-top:30px;padding-top:24px;border-top:1.5px solid var(--rule-strong)}
  .seal{flex-shrink:0}.seal svg{display:block}
  .hashbox{flex:1;min-width:0}
  .hashbox__k{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-soft);display:flex;align-items:center;gap:8px}
  .hashbox__k .algo{border:1px solid var(--gold);color:var(--gold);padding:1px 7px;font-size:9px;letter-spacing:.1em}
  .hashbox__hash{font-family:"IBM Plex Mono",monospace;font-size:12px;word-break:break-all;line-height:1.55;margin-top:7px${adulterado ? ";color:#9e2b2b;text-decoration:line-through" : ""}}
  .hashbox__meta{font-size:11px;color:var(--ink-soft);margin-top:11px;line-height:1.5}
  .hashbox__meta b{font-weight:600;color:var(--ink)}
  .tamper{margin-top:14px;font-size:11px;color:${adulterado ? "#9e2b2b" : "var(--ink-soft)"};font-style:italic;text-align:center}
  @media (max-width:560px){.doc__inner{padding:30px 24px}.grid{grid-template-columns:1fr}.head{flex-direction:column}.status{align-self:flex-start}.foot{flex-direction:column;align-items:flex-start}}
</style>
</head>
<body>
  <article class="doc">
    ${adulterado ? `<div class="stamp"><span>Tampered</span></div>` : ""}
    <div class="doc__inner">
      <header class="head">
        <div>
          <div class="eyebrow">Provenance Passport · Proof of Provenance</div>
          <h1 class="title">${substancia} — Certified Lot<small>Generated and verified offline on the device · QVAC edge AI</small></h1>
        </div>
        <div class="status">
          <div class="status__label"><span class="status__dot"></span>Status</div>
          <div class="status__value">${esc(st.label)}</div>
        </div>
      </header>
      <div class="lot">
        <span class="lot__k">Lot / Sample</span>
        <span class="lot__v">${ou(org.lote)}</span>
        <span class="substance">${ou(substancia)} ${min.substancia ? "(Au)" : ""}</span>
      </div>
      <section class="grid">
        <div class="field"><span class="field__k">Holder</span><span class="field__v">${ou(tit.nome)}</span></div>
        <div class="field"><span class="field__k">Tax ID</span><span class="field__v">${ou(tit.cpf_cnpj)}</span></div>
        <div class="field"><span class="field__k">ANM Process</span><span class="field__v">${ou(doc.numero_processo_anm)}</span></div>
        <div class="field"><span class="field__k">Regime</span><span class="field__v">${ou(regime)}</span></div>
        <div class="field"><span class="field__k">Municipality / State</span><span class="field__v">${ou(ar.municipio)} ${ar.uf ? "/ " + esc(ar.uf) : ""}</span></div>
        <div class="field"><span class="field__k">Coordinates</span><span class="field__v">${ou(ar.coordenadas)}</span></div>
        <div class="field"><span class="field__k">Grade</span><span class="field__v">${ou(min.teor)}</span></div>
        <div class="field"><span class="field__k">Mass</span><span class="field__v">${ou(massa)}</span></div>
        <div class="field"><span class="field__k">Issued</span><span class="field__v">${ou(doc.data_emissao)}</span></div>
        <div class="field"><span class="field__k">Valid until</span><span class="field__v">${ou(doc.validade)}</span></div>
      </section>
      <section class="verify">
        <div class="verify__h">Verification — automatic checks (auditable rules)</div>
        ${checagens || '<div class="check warn"><span class="check__mark">⚠</span>No checks</div>'}
      </section>
      <footer class="foot">
        <div class="seal" aria-label="Provenance seal">
          <svg width="116" height="116" viewBox="0 0 116 116" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="foil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3c766"/><stop offset=".5" stop-color="#b8891f"/><stop offset="1" stop-color="#8a6512"/></linearGradient>
              <path id="ring" d="M58,58 m-40,0 a40,40 0 1,1 80,0 a40,40 0 1,1 -80,0"/>
            </defs>
            <circle cx="58" cy="58" r="55" fill="none" stroke="url(#foil)" stroke-width="1.4"/>
            <circle cx="58" cy="58" r="49" fill="none" stroke="url(#foil)" stroke-width="2.4"/>
            <circle cx="58" cy="58" r="33" fill="none" stroke="url(#foil)" stroke-width="1"/>
            <text font-family="IBM Plex Mono, monospace" font-size="7.6" letter-spacing="2.4" fill="#8a6512" font-weight="500"><textPath href="#ring" startOffset="0%">• PROVENANCE VERIFIED • GOLD • QVAC •</textPath></text>
            <text x="58" y="54" text-anchor="middle" font-family="IBM Plex Serif, serif" font-size="26" font-weight="600" fill="url(#foil)">Au</text>
            <text x="58" y="68" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="6.5" letter-spacing="1.5" fill="#8a6512">SHA-256</text>
          </svg>
        </div>
        <div class="hashbox">
          <div class="hashbox__k">Cryptographic seal <span class="algo">${ou(selo.algoritmo || "SHA-256")}</span></div>
          <div class="hashbox__hash">${ou(selo.hash)}</div>
          <div class="hashbox__meta"><b>Generated on</b> ${esc(dataGerado)} &nbsp;·&nbsp; <b>Source</b> ${ou(v.fonte || "OCR offline + LLM local (QVAC)")}</div>
        </div>
      </footer>
      <p class="tamper">${adulterado ? "⚠ Invalid seal: the data was altered after issuance." : "Sealed document: changing a single character invalidates the seal."}</p>
    </div>
  </article>
</body>
</html>`;
}
