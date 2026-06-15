# QVAC SDK — referência verificada (use isto, não invente)

Fonte: https://docs.qvac.tether.io — confira a doc quando algo não estiver aqui.
Pacote: `@qvac/sdk` · Licença Apache 2.0 · roda em Node.js, Bare e Expo.

## Requisitos
- Node.js ≥ 22.17
- npm ≥ 10.9
- Projeto em ESM: `npm pkg set type=module`

## Instalação
```bash
npm i @qvac/sdk
```

## Ciclo de vida (sempre)
1. `loadModel(...)` — inicializa o SDK e carrega um modelo na memória.
2. Tarefa: `completion(...)`, `ocr(...)`, etc.
3. `unloadModel({ modelId })` — libera o modelo.
4. `close()` — encerra a instância do SDK ao final do processo.

`loadModel()` aceita modelo de 3 origens: caminho local, URL HTTP, ou o registro
distribuído da QVAC. As **constantes de modelo** (ex. `LLAMA_3_2_1B_INST_Q4_0`)
apontam para modelos já publicados no registro e cuidam do download/cache.

> A 1ª execução baixa o modelo (precisa de internet só nessa vez). Depois, offline.

## LLM — completion (texto / chat)
```js
import { loadModel, LLAMA_3_2_1B_INST_Q4_0, completion, unloadModel, close } from "@qvac/sdk";

const modelId = await loadModel({
  modelSrc: LLAMA_3_2_1B_INST_Q4_0,
  modelType: "llm",
  onProgress: (p) => console.log(p), // progresso do download
});

const history = [{ role: "user", content: "Olá, você roda local?" }];
const result = completion({ modelId, history, stream: true });

let texto = "";
for await (const token of result.tokenStream) texto += token; // tokenStream é async iterable

await unloadModel({ modelId });
await close();
```

## OCR — extrair texto de imagem (offline, via ONNX)
Pipeline de 2 estágios (detecção + reconhecimento). Modelo: `OCR_LATIN_RECOGNIZER_1`
(script latino — lê caracteres do português). `image` pode ser caminho (string) ou buffer.

```js
import { loadModel, ocr, OCR_LATIN_RECOGNIZER_1, unloadModel, close } from "@qvac/sdk";

const modelId = await loadModel({
  modelSrc: OCR_LATIN_RECOGNIZER_1,
  modelType: "ocr",
  modelConfig: {
    langList: ["en"],          // recognizer latino lê PT; testar ["pt"] / ver doc
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

## Outras capacidades (fora do MVP, conferir doc antes de usar)
- Transcrição (fala -> texto), TTS, tradução, embeddings, geração de imagem,
  multimodal, fine-tuning (LoRA), RAG (workflow pronto).
- P2P: **delegated inference** (delegar inferência a um peer via Holepunch),
  fetch de modelos por peers, blind relays.
  - A delegação seria algo como passar `delegate: { ... }` no `loadModel()`.
    **CONFERIR a página de "delegated inference" na doc antes de implementar** —
    não assumir a forma exata do objeto.

## Links úteis
- Docs: https://docs.qvac.tether.io
- Quickstart: https://docs.qvac.tether.io/sdk/getting-started/quickstart/
- API: https://docs.qvac.tether.io/sdk/api/
- OCR: https://docs.qvac.tether.io/sdk/examples/ai-tasks/ocr/
- RAG: https://docs.qvac.tether.io/sdk/examples/ai-tasks/rag/
- Delegated inference: https://docs.qvac.tether.io/sdk/examples/p2p/delegated-inference/
- Registro de modelos: https://github.com/tetherto/qvac/blob/main/packages/sdk/models/registry/models.ts
- Discord (dúvidas): https://discord.com/invite/tetherdev
