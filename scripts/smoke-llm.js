/**
 * Smoke test: proves that the local AI (QVAC) runs on this machine.
 * Usage: npm run smoke   (or: node scripts/smoke-llm.js)
 *
 * 1st run downloads the model (~1 GB) -> needs internet only that one time.
 * After that it runs offline.
 */
import { loadModel, LLAMA_3_2_1B_INST_Q4_0, completion, unloadModel } from "@qvac/sdk";

try {
  console.log("⏳ Loading the local model (may download on the 1st run)...");
  const modelId = await loadModel({
    modelSrc: LLAMA_3_2_1B_INST_Q4_0,
    modelType: "llm",
    onProgress: (progress) => console.log(progress),
  });

  console.log("\n✅ Model loaded. Response:\n");
  const history = [
    { role: "user", content: "Say in one sentence, in English, that you are running locally on my computer." },
  ];

  const result = completion({ modelId, history, stream: true });
  for await (const token of result.tokenStream) process.stdout.write(token);
  console.log("\n");

  await unloadModel({ modelId });
  console.log("🏁 All good: your machine runs offline AI with QVAC.");
} catch (error) {
  console.error("❌ Error:", error);
  process.exit(1);
}
