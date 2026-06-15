# QVAC Ouro · Passaporte de Procedência

Verificador de **procedência de ouro** que roda **IA offline** no próprio dispositivo,
usando o [QVAC SDK](https://docs.qvac.tether.io) (edge AI da Tether).

> Foto de um documento (licença/PLG da ANM, laudo, romaneio) → **OCR offline** →
> **LLM local** estrutura os dados → **JSON do passaporte** de procedência.

Projeto para o **QVAC Hackathon I – Unleash edge AI** (DoraHacks).

## Por que offline / edge
A cadeia do ouro tem pontos sem internet boa (área de extração, estrada, ponto de
coleta) e lida com documentos sensíveis. A IA local resolve sem nuvem — e o passaporte
gerado é o **lastro de procedência** que dá credibilidade a qualquer tokenização futura
(essa parte é a visão do pitch, não está implementada).

## Requisitos
- Node.js ≥ 22.17 · npm ≥ 10.9

## Começando
```bash
npm i @qvac/sdk        # instala o SDK
npm run smoke          # testa a IA local (baixa o modelo na 1ª vez, ~1 GB)
```

Quando tiver um documento, coloque em `samples/` e rode:
```bash
npm run passport -- ./samples/seu-documento.jpg
```
A 1ª execução baixa os modelos; depois roda **offline** (pode testar em modo avião).

## Estrutura
```
CLAUDE.md                contexto para o Claude Code (leia primeiro)
docs/qvac-notes.md       cheatsheet verificado da API QVAC
docs/provenance-schema.md  campos do passaporte
scripts/smoke-llm.js     "alô mundo" do LLM local
src/ocr.js               OCR offline
src/structure.js         texto -> JSON (LLM)
src/pipeline.js          foto -> OCR -> passaporte
src/index.js             entrada CLI
samples/                 documentos reais (não versionados)
```

## Roadmap
- [ ] Smoke test rodando (IA local OK)
- [ ] OCR offline em documento de ouro real
- [ ] LLM estruturando o passaporte (JSON)
- [ ] Pipeline foto → OCR → passaporte por CLI
- [ ] Caso de demo + vídeo (mostrar offline)
- [ ] Stretch: RAG ("área autorizada?"), voz, handoff P2P
- [ ] Submeter o BUIDL no DoraHacks

## Escopo
Foco no MVP de procedência offline. Tokenização e captação de recursos **não** fazem
parte do código (são a visão do pitch; captação pública tem implicações regulatórias).
