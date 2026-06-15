# Passaporte de procedência — esquema (rascunho)

Estrutura-alvo que o LLM deve preencher a partir do texto do OCR. Campos não
encontrados ficam como `null` (não inventar). Tudo permanece no dispositivo.

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

Notas:
- `status_licenca` é uma heurística baseada no texto — deixar claro na demo que é
  apoio à decisão, não validação oficial junto à ANM.
- Evoluir os campos conforme os documentos reais que o time conseguir.
