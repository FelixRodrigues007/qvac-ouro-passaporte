# Provenance passport — schema (draft)

The target structure the LLM should fill in from the OCR text. Fields that aren't
found stay as `null` (don't make things up). Everything stays on the device.

The schema is organized around the **9 provenance axes** (the gold's path from the
ground to the bar). Each block below maps to one axis — see "The 9 axes" guide
after the JSON. Blocks marked *partial* already existed; the rest are new and start
empty until we confirm them with real documents / domain input.

```json
{
  "documento": {
    "tipo": "licenca_anm | plg | laudo_ensaio | romaneio | dtvm_nf | outro",
    "numero_processo_anm": null,
    "data_emissao": null,
    "validade": null,
    "fase": "pesquisa | lavra | licenciamento | plg | null"
  },
  "titular": {
    "nome": null,
    "cpf_cnpj": null
  },
  "area": {
    "municipio": null,
    "uf": null,
    "coordenadas": null,
    "regime": "concessao_lavra | plg | autorizacao_pesquisa | null",
    "poligonal_confere": null,
    "sobreposicao": {
      "terra_indigena": null,
      "unidade_conservacao": null,
      "faixa_fronteira": null
    }
  },
  "lavra": {
    "operador": null,
    "forma_extracao": null,
    "ponto_extracao": null,
    "vinculo_titulo": null
  },
  "minerio": {
    "substancia": "ouro",
    "teor": null,
    "massa": null,
    "unidade": null
  },
  "beneficiamento": {
    "processo": null,
    "local": null
  },
  "ensaio": {
    "numero_laudo": null,
    "laboratorio": null,
    "responsavel_tecnico": null,
    "pureza": null,
    "data": null
  },
  "logistica": {
    "romaneio_numero": null,
    "lote": null,
    "transporte": null,
    "cadeia_custodia": null
  },
  "comercializacao": {
    "dtvm": null,
    "nota_fiscal_ouro": null,
    "primeira_aquisicao_data": null,
    "comprador": null
  },
  "tributos": {
    "cfem_recolhida": null,
    "cfem_comprovante": null,
    "observacoes": null
  },
  "ambiental": {
    "licenca": null,
    "orgao": null,
    "prad": null
  },
  "verificacao": {
    "status_licenca": "valida | vencida | nao_identificado",
    "eixos_cobertos": null,
    "observacoes": null,
    "gerado_em": null,
    "fonte": "OCR offline + LLM local (QVAC)"
  }
}
```

## The 9 axes

| # | Axis | Block(s) | New fields explained |
|---|------|----------|----------------------|
| 1 | **Direito mineral / título** | `documento` + `area.regime` | `fase` — which stage authorizes the gold (pesquisa → lavra/PLG → licenciamento). |
| 2 | **LAVRA (extração)** | `lavra` | `operador` (who extracts — may differ from `titular`), `forma_extracao` (aluvionar, filoniana, manual/mecanizada…), `vinculo_titulo` (is the dig covered by the title? `true`/`false`/`null`). |
| 3 | **Área & legalidade territorial** | `area` | `poligonal_confere` (coordinates match the process polygon?), `sobreposicao` — overlaps with indigenous land / conservation unit / border strip. |
| 4 | **Beneficiamento / teor** | `minerio` (*partial — `teor`*) + `beneficiamento` | `processo` (gravimetria, amalgamação, fundição…), `local`. |
| 5 | **Ensaio / laudo** | `ensaio` (*partial — `laudo_ensaio` type*) | `laboratorio`, `responsavel_tecnico` (name + CREA/ART if present), `pureza` (e.g. "999" / "23,5 quilates"). |
| 6 | **Logística / romaneio** | `logistica` (*partial — `lote`*) | `romaneio_numero`, `transporte`, `cadeia_custodia` (custody notes between steps). |
| 7 | **Comercialização / 1ª aquisição legal (DTVM)** | `comercializacao` | `dtvm` (institution that legalized the first purchase), `nota_fiscal_ouro`, `comprador`. Central in Brazilian gold. |
| 8 | **CFEM / tributos** | `tributos` | `cfem_recolhida` (royalty paid? `true`/`false`/`null`), `cfem_comprovante`. |
| 9 | **Ambiental** | `ambiental` | `licenca`, `orgao` (IBAMA / state agency), `prad` (recovery plan present? `true`/`false`/`null`). |

Notes:
- `status_licenca` is a heuristic based on the text — make it clear in the demo that it is
  decision support, not official validation with the ANM.
- The boolean-ish checks (`poligonal_confere`, `sobreposicao.*`, `vinculo_titulo`,
  `cfem_recolhida`, `ambiental.prad`) often **cannot** be answered from a single
  document — keep them `null` unless the text actually states it. They're stretch
  (e.g. polygon overlap needs a geo layer), not MVP.
- `eixos_cobertos` should list which of the 9 axes the document allowed us to fill,
  so the passport is honest about its own coverage.
- Evolve the fields as the team (and BenHur's feedback) gets hold of real documents.
