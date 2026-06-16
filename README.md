# QVAC Ouro · Provenance Passport

A **gold provenance** verifier that runs **offline AI** on the device itself,
using the [QVAC SDK](https://docs.qvac.tether.io) (Tether's edge AI).

> Photo of a document (ANM license/PLG, assay report, packing list) → **offline OCR** →
> **local LLM** structures the data → provenance **passport JSON**.

A project for the **QVAC Hackathon I – Unleash edge AI** (DoraHacks).

## Why offline / edge
The gold supply chain has points with no good internet (the extraction area, the road, the
collection point) and deals with sensitive documents. Local AI solves this without the cloud — and the
generated passport is the **provenance backing** that lends credibility to any future tokenization
(that part is the pitch's vision; it is not implemented).

## Requirements
- Node.js ≥ 22.17 · npm ≥ 10.9

## Getting started
```bash
npm i @qvac/sdk        # install the SDK
npm run smoke          # test the local AI (downloads the model on the 1st run, ~1 GB)
```

Once you have a document, place it in `samples/` and run:
```bash
npm run passport -- ./samples/your-document.jpg
```
The first run downloads the models; after that it runs **offline** (you can test it in airplane mode).

## Structure
```
CLAUDE.md                context for Claude Code (read first)
docs/qvac-notes.md       verified QVAC API cheatsheet
docs/provenance-schema.md  passport fields
scripts/smoke-llm.js     "hello world" of the local LLM
src/ocr.js               offline OCR
src/structure.js         text -> JSON (LLM)
src/pipeline.js          photo -> OCR -> passport
src/index.js             CLI entry point
samples/                 real documents (not versioned)
```

## Roadmap
- [ ] Smoke test running (local AI OK)
- [ ] Offline OCR on a real gold document
- [ ] LLM structuring the passport (JSON)
- [ ] Photo → OCR → passport pipeline via CLI
- [ ] Demo case + video (show it offline)
- [ ] Stretch: RAG ("is the area authorized?"), voice, P2P handoff
- [ ] Submit the BUIDL on DoraHacks

## Scope
Focused on the offline provenance MVP. Tokenization and fundraising are **not**
part of the code (they are the pitch's vision; public fundraising has regulatory implications).
