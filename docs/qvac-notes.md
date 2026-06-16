# QVAC SDK — verified reference (use this, don't make things up)

Source: https://docs.qvac.tether.io — check the docs when something isn't here.
Package: `@qvac/sdk` · Apache 2.0 License · runs on Node.js, Bare, and Expo.

## Requirements
- Node.js ≥ 22.17
- npm ≥ 10.9
- Project in ESM: `npm pkg set type=module`

## Installation
```bash
npm i @qvac/sdk
```

## Lifecycle (always)
1. `loadModel(...)` — initializes the SDK and loads a model into memory.
2. Task: `completion(...)`, `ocr(...)`, etc.
3. `unloadModel({ modelId })` — releases the model.
4. `close()` — shuts down the SDK instance at the end of the process.

`loadModel()` accepts a model from 3 sources: local path, HTTP URL, or QVAC's
distributed registry. The **model constants** (e.g. `LLAMA_3_2_1B_INST_Q4_0`)
point to models already published in the registry and handle the download/cache.

> The first run downloads the model (it only needs internet that one time). After that, offline.

## LLM — completion (text / chat)
```js
import { loadModel, LLAMA_3_2_1B_INST_Q4_0, completion, unloadModel, close } from "@qvac/sdk";

const modelId = await loadModel({
  modelSrc: LLAMA_3_2_1B_INST_Q4_0,
  modelType: "llm",
  onProgress: (p) => console.log(p), // download progress
});

const history = [{ role: "user", content: "Hello, are you running locally?" }];
const result = completion({ modelId, history, stream: true });

let text = "";
for await (const token of result.tokenStream) text += token; // tokenStream is an async iterable

await unloadModel({ modelId });
await close();
```

## OCR — extract text from an image (offline, via ONNX)
A 2-stage pipeline (detection + recognition). Model: `OCR_LATIN_RECOGNIZER_1`
(Latin script — reads Portuguese characters). `image` can be a path (string) or a buffer.

```js
import { loadModel, ocr, OCR_LATIN_RECOGNIZER_1, unloadModel, close } from "@qvac/sdk";

const modelId = await loadModel({
  modelSrc: OCR_LATIN_RECOGNIZER_1,
  modelType: "ocr",
  modelConfig: {
    langList: ["en"],          // the latin recognizer reads PT; try ["pt"] / see docs
    useGPU: true,
    timeout: 30000,
    magRatio: 1.5,
    defaultRotationAngles: [90, 180, 270],
    contrastRetry: false,
    lowConfidenceThreshold: 0.5,
    recognizerBatchSize: 1,
  },
});

const { blocks } = ocr({ modelId, image: "./samples/doc.jpg", options: { paragraph: false } });
const resultado = await blocks; // [{ text, bbox?, confidence? }, ...]

await unloadModel({ modelId, clearStorage: false });
await close();
```

## Other capabilities (outside the MVP, check the docs before using)
- Transcription (speech -> text), TTS, translation, embeddings, image generation,
  multimodal, fine-tuning (LoRA), RAG (ready-made workflow).
- P2P: **delegated inference** (delegating inference to a peer via Holepunch),
  fetching models from peers, blind relays.
  - Delegation would be something like passing `delegate: { ... }` in `loadModel()`.
    **CHECK the "delegated inference" page in the docs before implementing** —
    don't assume the exact shape of the object.

## Useful links
- Docs: https://docs.qvac.tether.io
- Quickstart: https://docs.qvac.tether.io/sdk/getting-started/quickstart/
- API: https://docs.qvac.tether.io/sdk/api/
- OCR: https://docs.qvac.tether.io/sdk/examples/ai-tasks/ocr/
- RAG: https://docs.qvac.tether.io/sdk/examples/ai-tasks/rag/
- Delegated inference: https://docs.qvac.tether.io/sdk/examples/p2p/delegated-inference/
- Model registry: https://github.com/tetherto/qvac/blob/main/packages/sdk/models/registry/models.ts
- Discord (questions): https://discord.com/invite/tetherdev
