/**
 * Cryptographic seal (anti-fraud) — pure Node, no QVAC.
 *
 * Idea: generate a SHA-256 of a CANONICAL serialization of the passport. Since the
 * serialization sorts the keys, reordering fields does not change the hash — only a
 * real change in content (e.g.: tampering with the grade) breaks the seal.
 */
import { createHash } from "node:crypto";

/**
 * Canonical form of the value: objects with keys sorted recursively,
 * arrays mapped, and the "selo" field always removed (it does not enter the hash).
 */
function canonico(valor) {
  if (Array.isArray(valor)) {
    return valor.map(canonico);
  }
  if (valor && typeof valor === "object") {
    const saida = {};
    for (const chave of Object.keys(valor).sort()) {
      if (chave === "selo") continue; // the seal never enters its own hash
      saida[chave] = canonico(valor[chave]);
    }
    return saida;
  }
  return valor;
}

/** SHA-256 of the canonical serialization (no whitespace, without the "selo" field). */
function hashCanonico(passaporte) {
  const texto = JSON.stringify(canonico(passaporte));
  return createHash("sha256").update(texto, "utf8").digest("hex");
}

/**
 * Returns a COPY of the passport with the "selo" field added.
 * @param {object} passaporte
 * @returns {object} sealed copy
 */
export function selar(passaporte) {
  const copia = structuredClone(passaporte); // does not mutate the original
  copia.selo = {
    algoritmo: "SHA-256",
    hash: hashCanonico(copia),
    gerado_em: new Date().toISOString(),
  };
  return copia;
}

/**
 * Recomputes the hash and compares it with the recorded seal.
 * @param {object} passaporte
 * @returns {{ integro: boolean, esperado: string|null, atual: string }}
 */
export function verificarSelo(passaporte) {
  const esperado = passaporte?.selo?.hash ?? null;
  const atual = hashCanonico(passaporte);
  return { integro: esperado === atual, esperado, atual };
}
