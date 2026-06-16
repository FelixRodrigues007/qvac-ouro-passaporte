#!/usr/bin/env bash
# One command to run the LIVE P2P demo: provider + relay + ngrok (stable domain).
# While this runs, the public site's "Delegate now" button is online.
# Ctrl+C stops all three.
#
#   npm run p2p:live
#
# Overridable: SEED_PHRASE=... NGROK_DOMAIN=...ngrok-free.dev PORT=8787 npm run p2p:live
cd "$(dirname "$0")/.." || exit 1

SEED_PHRASE="${SEED_PHRASE:-aupass-demo}"
SEED=$(node -e "console.log(require('crypto').createHash('sha256').update(process.argv[1]).digest('hex'))" "$SEED_PHRASE")
DOMAIN="${NGROK_DOMAIN:-snuff-mountain-movie.ngrok-free.dev}"
PORT="${PORT:-8787}"

PROV=""; RELAY=""
cleanup() {
  echo ""; echo "🧹 stopping provider + relay + ngrok…"
  [ -n "$RELAY" ] && kill "$RELAY" 2>/dev/null
  [ -n "$PROV" ] && kill "$PROV" 2>/dev/null
  pkill -f "scripts/p2p-relay.js" 2>/dev/null
  pkill -f "scripts/p2p-provider.js" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

logp=$(mktemp); logr=$(mktemp)

echo "▶ provider (stable identity from \"$SEED_PHRASE\")…"
QVAC_HYPERSWARM_SEED="$SEED" node scripts/p2p-provider.js >"$logp" 2>&1 &
PROV=$!
while ! grep -q 'PROVIDER_PUBLIC_KEY=' "$logp" 2>/dev/null; do
  if grep -qE '❌|Invalid input|Error:' "$logp" 2>/dev/null; then echo "provider failed:"; tail -15 "$logp"; cleanup; fi
  sleep 0.5
done
KEY=$(grep -m1 'PROVIDER_PUBLIC_KEY=' "$logp" | sed 's/.*PROVIDER_PUBLIC_KEY=//')
echo "  provider key: ${KEY:0:8}…"

echo "▶ relay (delegated consumer)…"
PROVIDER_KEY="$KEY" node scripts/p2p-relay.js >"$logr" 2>&1 &
RELAY=$!
while ! grep -q 'Relay on http' "$logr" 2>/dev/null; do
  if grep -qE 'Usage:|Error:' "$logr" 2>/dev/null; then echo "relay failed:"; tail -15 "$logr"; cleanup; fi
  sleep 0.5
done
echo "  relay on http://localhost:$PORT"

echo "▶ ngrok ($DOMAIN)…"
echo "✅ LIVE — the button at https://web-felix-rodrigues-projects.vercel.app is online. Ctrl+C to stop."
ngrok http --domain="$DOMAIN" "$PORT"
cleanup
