# CLAUDE.md — QVAC Gold · Provenance Passport

> Context for Claude Code. **Read before generating or editing code.**

## What this project is
A **local-first / offline** tool that generates a "provenance passport" for
batches of **gold**, starting from real documents (ANM license / PLG, assay
reports, packing lists). Core flow:

```
document photo  ->  OCR (offline)  ->  LLM structures  ->  passport JSON
```

Built on the **QVAC SDK** (`@qvac/sdk`), Tether's *edge AI* stack: it runs
AI on the device itself, with no cloud, using P2P via Holepunch.

Made for the **QVAC Hackathon I – Unleash edge AI** (DoraHacks), theme "edge AI".
**Deadline: ~2026-06-22.** Local AI is the heart of the project and the judges'
criterion — **do not replace it with cloud calls.**

## MVP scope (focus)
**IN:**
- Offline OCR of 1 real gold document (`src/ocr.js`).
- LLM turns the raw text into the structured passport (`src/structure.js`).
- Pipeline `foto -> OCR -> passaporte` running via CLI (`src/index.js`).
- Clean JSON output + one polished demo case.

**OUT (becomes pitch/vision, do NOT build now):**
- Tokenization / blockchain of the assets.
- Public fundraising (regulatory matter — CVM; do not implement).
- Full mobile app.

**Stretch (only if time is left, and after checking the docs):**
- RAG over concession documents ("is this area authorized?").
- Voice-based field logging (offline transcription).
- P2P handoff (delegated inference) phone -> PC.

## Stack and how to run
- **Node.js ≥ 22.17, npm ≥ 10.9**, ESM (`"type": "module"`).
- Single dependency: `@qvac/sdk`. Install with `npm i @qvac/sdk`.
- Smoke test (local AI working): `npm run smoke`
- Generate a passport from an image: `npm run passport -- ./samples/<file>`
- **First run downloads the model (~1 GB)** and needs internet only that one time; after that it runs offline.

## Structure
- `scripts/smoke-llm.js` — "hello world" of the local LLM (proves the machine runs it).
- `src/config.js` — model constants and OCR configuration.
- `src/ocr.js` — extracts text from the image (offline OCR).
- `src/structure.js` — raw text -> passport JSON (LLM).
- `src/pipeline.js` — orchestrates photo -> OCR -> passport.
- `src/index.js` — CLI entry point.
- `docs/qvac-notes.md` — **verified QVAC API cheatsheet** (use this, don't make things up).
- `docs/provenance-schema.md` — passport fields.
- `samples/` — real documents (do NOT version; they are in `.gitignore` because they are sensitive).

## Important rules for the agent
1. **QVAC is new; your training knowledge may not cover it.** Before using
   any `@qvac/sdk` API, check `docs/qvac-notes.md` and, when in doubt, the
   official docs at https://docs.qvac.tether.io. **Never invent function names or
   model constants.**
2. Keep it **offline-first**: no calling cloud APIs for inference. All AI
   runs via `@qvac/sdk`.
3. Always follow the lifecycle: `loadModel()` -> task -> `unloadModel()` ->
   `close()` at the end of the process.
4. The data is **sensitive** (documents, CPF/CNPJ, coordinates). Do not log personal
   data unnecessarily; nothing leaves the device.
5. Do **not** implement tokenization or fundraising — that is only pitch narrative.
6. Simple, readable code (the author is a beginner). Comment the "why". Small,
   easy-to-test functions. Messages and comments in English.

## Product principles
- **Why offline matters here:** remote extraction areas, no signal; commercially
  and regulatorily sensitive data. That's why *edge AI*, not cloud.
- The passport is the **provenance backing** that would give credibility to any
  future tokenization. That is the link between what we build and the pitch's vision.

## Build in public
Opt-in done at the hackathon. Record progress (clear commits, notes, screenshots).
Good narrative: "I learned to run AI offline and build a gold provenance
verifier in a week".

## Domain glossary
- **ANM** — National Mining Agency (authorizes prospecting and mining).
- **PLG** — Garimpeira Mining Permit (the regime for artisanal/garimpo gold).
- **Teor** — grade (concentration of the metal in the ore).
- **Romaneio** — packing list (a document listing items/quantities of a batch or shipment).
