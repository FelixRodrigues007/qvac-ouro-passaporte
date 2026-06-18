/**
 * Offline speech-to-text (field voice logging) via QVAC Whisper.
 * 100% on-device — the same edge-AI principle as the OCR/LLM steps.
 *
 *   npm run transcribe -- ./documentos-reais/audio.opus [more files...]
 *
 * Audio is decoded by the SDK; formats other than wav/ogg/mp3/m4a/flac/aac
 * (e.g. WhatsApp .opus or .mp4) should be converted first, e.g.:
 *   ffmpeg -i in.opus -ar 16000 -ac 1 out.wav
 *
 * First run downloads the Whisper model (~base) once; after that it runs offline.
 */
import { loadModel, unloadModel, transcribe, close, WHISPER_BASE_Q8_0 } from "@qvac/sdk";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: npm run transcribe -- <audio1> [audio2 ...]");
  process.exit(1);
}

console.log("📥 Loading Whisper (offline)…");
// language "pt": the field notes are Brazilian Portuguese. GPU when available.
const modelId = await loadModel({
  modelSrc: WHISPER_BASE_Q8_0,
  modelConfig: {
    audio_format: "f32le",
    strategy: "greedy",
    n_threads: 4,
    language: "pt",
    translate: false,
    no_timestamps: false,
    single_segment: false,
    temperature: 0.0,
    suppress_blank: true,
    suppress_nst: true,
    entropy_thold: 2.4,
    logprob_thold: -1.0,
    vad_params: {
      threshold: 0.35,
      min_speech_duration_ms: 200,
      min_silence_duration_ms: 150,
      max_speech_duration_s: 30.0,
      speech_pad_ms: 600,
      samples_overlap: 0.3,
    },
    contextParams: { use_gpu: true, flash_attn: true, gpu_device: 0 },
  },
});

try {
  for (const f of files) {
    console.log(`\n🎧 Transcribing ${f}…`);
    const text = await transcribe({ modelId, audioChunk: f });
    console.log(`===== ${f} =====`);
    console.log(text.trim());
  }
} finally {
  await unloadModel({ modelId });
  try { await close(); } catch {}
}
