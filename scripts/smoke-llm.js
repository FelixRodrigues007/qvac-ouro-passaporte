/**
 * Smoke test: prova que a IA local (QVAC) roda nesta máquina.
 * Uso: npm run smoke   (ou: node scripts/smoke-llm.js)
 *
 * 1ª execução baixa o modelo (~1 GB) -> precisa de internet só nessa vez.
 * Depois roda offline.
 */
import { loadModel, LLAMA_3_2_1B_INST_Q4_0, completion, unloadModel } from "@qvac/sdk";

try {
  console.log("⏳ Carregando o modelo local (pode baixar na 1ª vez)...");
  const modelId = await loadModel({
    modelSrc: LLAMA_3_2_1B_INST_Q4_0,
    modelType: "llm",
    onProgress: (progress) => console.log(progress),
  });

  console.log("\n✅ Modelo carregado. Resposta:\n");
  const history = [
    { role: "user", content: "Diga em uma frase, em português, que você está rodando localmente no meu computador." },
  ];

  const result = completion({ modelId, history, stream: true });
  for await (const token of result.tokenStream) process.stdout.write(token);
  console.log("\n");

  await unloadModel({ modelId });
  console.log("🏁 Tudo certo: sua máquina roda IA offline com a QVAC.");
} catch (error) {
  console.error("❌ Erro:", error);
  process.exit(1);
}
