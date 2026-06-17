#!/usr/bin/env bash
# Generates hardware-proof.txt — real machine specs + toolchain versions.
# (Serial Number / Hardware UUID / Provisioning UDID are redacted by default — remove
#  the sed filter below if you want them in the proof.)
cd "$(dirname "$0")/.." || exit 1
out="hardware-proof.txt"
{
  echo "AuPass — hardware proof"
  echo "generated: $(date)"
  echo
  echo "===== system_profiler SPHardwareDataType ====="
  system_profiler SPHardwareDataType | sed -E \
    -e 's/(Serial Number.*: ).*/\1[redacted]/' \
    -e 's/(Hardware UUID.*: ).*/\1[redacted]/' \
    -e 's/(Provisioning UDID.*: ).*/\1[redacted]/'
  echo
  echo "===== sw_vers ====="
  sw_vers
  echo
  echo "===== node --version ====="; node --version
  echo "===== npm --version ====="; npm --version
} > "$out"
echo "wrote $out"
