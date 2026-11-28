#!/usr/bin/env bash
# Renders the detailed floor to ceiling video at 1440p (2560 x 1440) in 5-second chunks (out/chunks/ftcd-*), skipping
# finished chunks, then joins them. Safe to rerun after an interruption: it picks up where it stopped.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out/chunks
DUR=248; STEP=5
list=out/chunks/ftcd-list.txt; : > "$list"
for ((s = 0; s < DUR; s += STEP)); do
  e=$((s + STEP > DUR ? DUR : s + STEP))
  f=ftcd-$(printf %03d $s).mp4
  [ -f out/chunks/$f ] || Q=ao=8 node render.mjs h --page install-ftcd.html --dpr 1.3333334 --gl 1 --from $s --to $e --name chunks/$f
  echo "file '$f'" >> "$list"
done
ffmpeg -y -loglevel error -f concat -safe 0 -i "$list" -c copy -movflags +faststart out/install-floor-to-ceiling-1440p.mp4
echo "wrote out/install-floor-to-ceiling-1440p.mp4"
