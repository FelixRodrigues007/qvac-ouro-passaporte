# CLAUDE.md — QVAC Ouro · Passaporte de Procedência

> Contexto para o Claude Code. **Leia antes de gerar ou editar código.**

## O que é este projeto
Ferramenta **local-first / offline** que gera um "passaporte de procedência" para
lotes de **ouro**, a partir de documentos reais (licença / PLG da ANM, laudos de
ensaio, romaneios). Fluxo central:

```
foto do documento  ->  OCR (offline)  ->  LLM estrutura  ->  JSON do passaporte
```

Construído sobre o **QVAC SDK** (`@qvac/sdk`), a stack de *edge AI* da Tether: roda
IA no próprio dispositivo, sem nuvem, com P2P via Holepunch.

Feito para o **QVAC Hackathon I – Unleash edge AI** (DoraHacks), tema "edge AI".
**Prazo: ~22/06/2026.** A IA local é o coração do projeto e o critério dos juízes —
**não substituir por chamadas de nuvem.**

## Escopo do MVP (foco)
**DENTRO:**
- OCR offline de 1 documento de ouro real (`src/ocr.js`).
- LLM transforma o texto cru no passaporte estruturado (`src/structure.js`).
- Pipeline `foto -> OCR -> passaporte` rodando por CLI (`src/index.js`).
- Saída JSON limpa + um caso de demonstração redondo.

**FORA (vira pitch/visão, NÃO construir agora):**
- Tokenização / blockchain dos ativos.
- Captação pública de recursos (questão regulatória — CVM; não implementar).
- App mobile completo.

**Stretch (só se sobrar tempo, e conferindo a doc):**
- RAG sobre documentos da concessão ("essa área está autorizada?").
- Registro de campo por voz (transcrição offline).
- Handoff P2P (delegated inference) celular -> PC.

## Stack e como rodar
- **Node.js ≥ 22.17, npm ≥ 10.9**, ESM (`"type": "module"`).
- Dependência única: `@qvac/sdk`. Instalar com `npm i @qvac/sdk`.
- Smoke test (IA local funcionando): `npm run smoke`
- Gerar passaporte de uma imagem: `npm run passport -- ./samples/<arquivo>`
- **1ª execução baixa o modelo (~1 GB)** e precisa de internet só nessa vez; depois roda offline.

## Estrutura
- `scripts/smoke-llm.js` — "alô mundo" do LLM local (prova que a máquina roda).
- `src/config.js` — constantes de modelo e configuração de OCR.
- `src/ocr.js` — extrai texto da imagem (OCR offline).
- `src/structure.js` — texto cru -> JSON do passaporte (LLM).
- `src/pipeline.js` — orquestra foto -> OCR -> passaporte.
- `src/index.js` — entrada CLI.
- `docs/qvac-notes.md` — **cheatsheet verificado da API QVAC** (use isto, não invente).
- `docs/provenance-schema.md` — campos do passaporte.
- `samples/` — documentos reais (NÃO versionar; estão no `.gitignore` por serem sensíveis).

## Regras importantes para o agente
1. **A QVAC é nova; seu conhecimento de treino pode não cobri-la.** Antes de usar
   qualquer API do `@qvac/sdk`, confira `docs/qvac-notes.md` e, na dúvida, a doc
   oficial em https://docs.qvac.tether.io. **Nunca invente nomes de função ou
   constantes de modelo.**
2. Manter **offline-first**: nada de chamar API de nuvem para a inferência. Toda IA
   roda via `@qvac/sdk`.
3. Sempre seguir o ciclo de vida: `loadModel()` -> tarefa -> `unloadModel()` ->
   `close()` ao final do processo.
4. O dado é **sensível** (documentos, CPF/CNPJ, coordenadas). Não logar dado pessoal
   sem necessidade; nada sai do dispositivo.
5. **Não** implementar tokenização nem captação de recursos — isso é só narrativa do pitch.
6. Código simples e legível (o autor é iniciante). Comentar o "porquê". Funções
   pequenas e fáceis de testar. Mensagens e comentários em português.

## Princípios do produto
- **Por que offline importa aqui:** área de extração remota, sem sinal; dado
  comercial e regulatório sensível. Por isso *edge AI*, não nuvem.
- O passaporte é o **lastro de procedência** que daria credibilidade a qualquer
  tokenização futura. Esse é o vínculo entre o que construímos e a visão do pitch.

## Build in public
Opt-in feito no hackathon. Registrar progresso (commits claros, notas, prints).
Boa narrativa: "aprendi a rodar IA offline e montar um verificador de procedência
de ouro em uma semana".

## Glossário de domínio
- **ANM** — Agência Nacional de Mineração (autoriza pesquisa e lavra).
- **PLG** — Permissão de Lavra Garimpeira (regime do ouro de garimpo).
- **Teor** — concentração do metal no minério.
- **Romaneio** — documento que lista itens/quantidades de um lote ou carga.
