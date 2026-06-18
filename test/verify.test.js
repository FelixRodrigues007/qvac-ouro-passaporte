/**
 * Tests for the deterministic verification rules (src/verify.js).
 * Run: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { verificar } from "../src/verify.js";

// A passport that passes every existing check (so status is "valida"),
// letting each test isolate the effect of the gold-grade rule.
const basePassport = () => ({
  documento: { numero_processo_anm: "800.999/2025", data_emissao: "02/06/2026", validade: "02/06/2099" },
  titular: { nome: "Mineradora Exemplo LTDA", cpf_cnpj: "11.222.333/0001-81" },
  area: { regime: "plg" },
  minerio: { teor: null },
});
const hoje = new Date("2026-06-18");

test("baseline sem teor → valida (sanidade)", () => {
  const r = verificar(basePassport(), { hoje });
  assert.equal(r.status, "valida");
  assert.equal(r.alertas, 0);
});

test("teor plausível (12,4 g/t) não dispara alerta de fraude", () => {
  const p = basePassport(); p.minerio.teor = "12,4 g/t";
  const r = verificar(p, { hoje });
  assert.ok(!r.checagens.some((c) => /implaus/i.test(c)), "não deveria flag teor plausível");
  assert.equal(r.status, "valida");
});

test("teor implausível (80 g/t) dispara alerta e sai de valida", () => {
  const p = basePassport(); p.minerio.teor = "80 g/t";
  const r = verificar(p, { hoje });
  assert.ok(r.checagens.some((c) => /implaus/i.test(c)), "deveria flag 80 g/t");
  assert.notEqual(r.status, "valida");
});

test("teor BR com milhar (1.289,05 g/t) é parseado e flagado", () => {
  const p = basePassport(); p.minerio.teor = "1.289,05 g/t";
  const r = verificar(p, { hoje });
  assert.ok(r.checagens.some((c) => /implaus/i.test(c)), "deveria flag 1.289,05 g/t");
});

test("teor baixo com ponto decimal (0.35 g/t) NÃO é flagado (sem falso positivo)", () => {
  const p = basePassport(); p.minerio.teor = "0.35 g/t";
  const r = verificar(p, { hoje });
  assert.ok(!r.checagens.some((c) => /implaus/i.test(c)), "0.35 g/t não pode ser tratado como 35");
  assert.equal(r.status, "valida");
});
