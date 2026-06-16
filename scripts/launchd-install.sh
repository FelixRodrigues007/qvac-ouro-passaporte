#!/usr/bin/env bash
# Install a macOS LaunchAgent that auto-runs `npm run p2p:live` (provider + relay
# + ngrok) at login and keeps it alive. The public site button stays online while
# you're logged in and the Mac is awake.
#
#   bash scripts/launchd-install.sh      # install + start now
#   launchctl bootout gui/$(id -u)/com.aupass.p2p-live   # stop + disable
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="com.aupass.p2p-live"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
NODE_DIR="$(dirname "$(command -v node)")"
NGROK_DIR="$(dirname "$(command -v ngrok)")"
PATHV="$NODE_DIR:$NGROK_DIR:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$REPO/scripts/p2p-live.sh</string>
  </array>
  <key>WorkingDirectory</key><string>$REPO</string>
  <key>EnvironmentVariables</key><dict><key>PATH</key><string>$PATHV</string></dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>60</integer>
  <key>StandardOutPath</key><string>$REPO/p2p-live.log</string>
  <key>StandardErrorPath</key><string>$REPO/p2p-live.log</string>
</dict>
</plist>
PL

UID_NUM="$(id -u)"
launchctl bootout "gui/$UID_NUM/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$UID_NUM" "$PLIST"

echo "✅ Installed + started: $LABEL"
echo "   plist : $PLIST"
echo "   logs  : $REPO/p2p-live.log"
echo "   stop  : launchctl bootout gui/$UID_NUM/$LABEL"
echo "   start : launchctl bootstrap gui/$UID_NUM \"$PLIST\""
