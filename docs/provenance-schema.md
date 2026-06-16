# Provenance passport — schema (draft)

The target structure the LLM should fill in from the OCR text. Fields that aren't
found stay as `null` (don't make things up). Everything stays on the device.

```json
{
  "documento": {
    "tipo": "licenca_anm | plg | laudo_ensaio | romaneio | outro",
    "numero_processo_anm": null,
    "data_emissao": null,
    "validade": null
  },
  "titular": {
    "nome": null,
    "cpf_cnpj": null
  },
  "area": {
    "municipio": null,
    "uf": null,
    "coordenadas": null,
    "regime": "concessao_lavra | plg | autorizacao_pesquisa | null"
  },
  "minerio": {
    "substancia": "ouro",
    "teor": null,
    "massa": null,
    "unidade": null
  },
  "origem": {
    "lote": null,
    "ponto_extracao": null
  },
  "verificacao": {
    "status_licenca": "valida | vencida | nao_identificado",
    "observacoes": null,
    "gerado_em": null,
    "fonte": "OCR offline + LLM local (QVAC)"
  }
}
```

Notes:
- `status_licenca` is a heuristic based on the text — make it clear in the demo that it is
  decision support, not official validation with the ANM.
- Evolve the fields as the team gets hold of real documents.
