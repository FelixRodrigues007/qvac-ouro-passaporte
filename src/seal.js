/**
 * Selo criptográfico (anti-fraude) — Node puro, sem QVAC.
 *
 * Ideia: gerar um SHA-256 de uma serialização CANÔNICA do passaporte. Como a
 * serialização ordena as chaves, reordenar campos não muda o hash — só uma
 * alteração real de conteúdo (ex.: mexer no teor) quebra o selo.
 */
import { createHash } from "node:crypto";

/**
 * Forma canônica do valor: objetos com chaves ordenadas recursivamente,
 * arrays mapeados, e o campo "selo" sempre removido (ele não entra no hash).
 */
function canonico(valor) {
  if (Array.isArray(valor)) {
    return valor.map(canonico);
  }
  if (valor && typeof valor === "object") {
    const saida = {};
    for (const chave of Object.keys(valor).sort()) {
      if (chave === "selo") continue; // o selo nunca entra no próprio hash
      saida[chave] = canonico(valor[chave]);
    }
    return saida;
  }
  return valor;
}

/** SHA-256 da serialização canônica (sem espaços, sem o campo "selo"). */
function hashCanonico(passaporte) {
  const texto = JSON.stringify(canonico(passaporte));
  return createHash("sha256").update(texto, "utf8").digest("hex");
}

/**
 * Devolve uma CÓPIA do passaporte com o campo "selo" adicionado.
 * @param {object} passaporte
 * @returns {object} cópia selada
 */
export function selar(passaporte) {
  const copia = structuredClone(passaporte); // não muta o original
  copia.selo = {
    algoritmo: "SHA-256",
    hash: hashCanonico(copia),
    gerado_em: new Date().toISOString(),
  };
  return copia;
}

/**
 * Recalcula o hash e compara com o selo gravado.
 * @param {object} passaporte
 * @returns {{ integro: boolean, esperado: string|null, atual: string }}
 */
export function verificarSelo(passaporte) {
  const esperado = passaporte?.selo?.hash ?? null;
  const atual = hashCanonico(passaporte);
  return { integro: esperado === atual, esperado, atual };
}
