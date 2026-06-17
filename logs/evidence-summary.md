# AuPass — Evidence Bundle (real, measured)

_Generated 2026-06-17T14:16:42.341Z. Every number below comes from the on-device audit log (`src/audit.js`) written on each run — nothing is hand-written._

- **Device:** MacBook Pro · Apple M3 Pro · 36 GB RAM · macOS 26.5
- **Total runs:** 13  (local: 10, delegated / P2P: 3)
- **Document:** `samples/laudo-ouro-EXEMPLO.png` · **passport status (last run):** atencao

## Local vs Delegated (P2P) — inference

TTFT and tok/s are averaged across **all** runs of each mode (model-load cost does not affect them).

| Mode | Runs | Avg TTFT (ms) | Avg tokens/sec |
|------|-----:|--------------:|---------------:|
| Local — on-device | 10 | 1249.6 | 40.7 |
| Delegated — P2P peer | 3 | 1390.8 | 36.5 |

The **delegated** rows run the LLM on a **peer's GPU over an end-to-end-encrypted P2P link** (QVAC over Holepunch's DHT), while **OCR, the rule-based verification, and the SHA-256 seal stay local** on this device.

## Model load — COLD vs WARM (local mode)

The LLM is loaded into memory before inference. The **first** load on a fresh machine is *cold* (model read from disk); later loads are *warm* (model already resident). Reported separately so the one-time cold cost does not distort the average.

| Load | When | ms |
|------|------|---:|
| LLM — **cold** (first use, cold disk) | one-time, worst case observed | 20142.8 |
| LLM — **warm** (avg of runs 2+) | steady state | 4847.6 |
| OCR (ONNX) | avg of all local runs | 2303.2 |

> **Cold load is a one-time cost** — the price of reading the ~1 GB model off disk into memory the first time. Once resident, every later run pays only the warm cost. Steady-state performance is the warm number.

**What "delegated" means:** the heavy **LLM runs on a peer's machine** over an **end-to-end-encrypted peer-to-peer connection** (QVAC over Holepunch's DHT) — no server, no cloud. Meanwhile **OCR, the rule-based verification, and the SHA-256 seal stay local** on this device. So the delegated rows measure a model running on a *remote GPU reached over P2P*, while the rest of the trust pipeline is still on-device.

Raw per-run records (one JSON object per line): [`evidence.jsonl`](evidence.jsonl)
