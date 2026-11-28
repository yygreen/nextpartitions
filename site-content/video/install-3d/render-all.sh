#!/usr/bin/env bash
# Renders the installation video in 5-second chunks (out/chunks/), skipping chunks already finished, then joins each cut.
# Safe to rerun after an interruption: it picks up where it stopped. Usage: ./render-all.sh [h|v|both]
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out/chunks
DUR=140; STEP=5
for mode in ${1:-h v}; do
  [ "$mode" = both ] && continue
  list=out/chunks/list-$mode.txt; : > "$list"
  for ((s = 0; s < DUR; s += STEP)); do
    f=$mode-$(printf %03d $s).mp4
    [ -f out/chunks/$f ] || node render.mjs $mode --from $s --to $((s + STEP)) --name chunks/$f
    echo "file '$f'" >> "$list"
  done
  name=$([ "$mode" = v ] && echo install-overhead-braced-9x16.mp4 || echo install-overhead-braced-16x9-4k.mp4)
  ffmpeg -y -loglevel error -f concat -safe 0 -i "$list" -c copy -movflags +faststart out/$name
  echo "wrote out/$name"
done
