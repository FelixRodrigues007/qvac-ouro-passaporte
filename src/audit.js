/**
 * Log de auditoria estruturado (Node puro — não importa QVAC).
 * Captura: carga/descarga de modelos e desempenho de inferência
 * (prompt, tokens de saída, TTFT, tokens/seg) de uma execução.
 *
 *   const audit = createAudit({ device });
 *   audit.modelLoadStart("LLM"); ... audit.modelLoadEnd("LLM", { src });
 *   const t = audit.inferenceStart("LLM", promptText);
 *   t.firstToken();            // marca o TTFT (no 1º token)
 *   t.token(); t.token(); ...  // 1x por token recebido
 *   t.end();                   // fecha e calcula tokens/seg
 *   audit.modelUnload("LLM");
 *   audit.save("out/<id>.audit.json");
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

export function createAudit(meta = {}) {
  const runStart = new Date();
  const models = {};
  const inferences = [];
  const events = [];
  const stamp = (type, extra) => events.push({ at: new Date().toISOString(), type, ...extra });

  return {
    modelLoadStart(name) {
      models[name] = { load_start_ms: now() };
      stamp("model_load_start", { model: name });
    },
    modelLoadEnd(name, extra = {}) {
      const m = (models[name] ||= {});
      m.load_end_ms = now();
      m.load_ms = +(m.load_end_ms - (m.load_start_ms ?? m.load_end_ms)).toFixed(1);
      Object.assign(m, extra);
      stamp("model_load_end", { model: name, load_ms: m.load_ms });
    },
    modelUnload(name) {
      const m = (models[name] ||= {});
      m.unloaded = true;
      stamp("model_unload", { model: name });
    },
    // Mede uma chamada de inferência
    inferenceStart(model, prompt = "") {
      const start = now();
      const rec = {
        model,
        prompt_chars: String(prompt).length,
        prompt_preview: String(prompt).slice(0, 160),
        output_tokens: 0,
        ttft_ms: null,
        total_ms: null,
        tokens_per_sec: null,
      };
      let firstAt = null;
      return {
        firstToken() { if (firstAt == null) { firstAt = now(); rec.ttft_ms = +(firstAt - start).toFixed(1); } },
        token(n = 1) { rec.output_tokens += n; },
        end() {
          const end = now();
          rec.total_ms = +(end - start).toFixed(1);
          const genMs = firstAt != null ? end - firstAt : end - start;
          rec.tokens_per_sec = genMs > 0 ? +((rec.output_tokens / (genMs / 1000))).toFixed(2) : null;
          inferences.push(rec);
          stamp("inference", { model, output_tokens: rec.output_tokens, ttft_ms: rec.ttft_ms, total_ms: rec.total_ms, tokens_per_sec: rec.tokens_per_sec });
          return rec;
        },
      };
    },
    save(path) {
      const out = {
        run_started: runStart.toISOString(),
        run_finished: new Date().toISOString(),
        device: meta.device ?? null,
        models,
        inferences,
        events,
      };
      try { mkdirSync(dirname(path), { recursive: true }); } catch {}
      writeFileSync(path, JSON.stringify(out, null, 2));
      return out;
    },
    summary() {
      const lines = ["── Audit ──"];
      for (const [k, m] of Object.entries(models)) lines.push(`  ${k}: load ${m.load_ms ?? "?"} ms${m.unloaded ? " (unloaded)" : ""}`);
      for (const i of inferences) lines.push(`  ${i.model}: ${i.output_tokens} tok · TTFT ${i.ttft_ms} ms · ${i.tokens_per_sec} tok/s`);
      return lines.join("\n");
    },
  };
}
