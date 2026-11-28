#!/usr/bin/env bash
# Renders the detailed phenolic (overhead braced) video at 1440p (2560 x 1440) in 5-second chunks (out/chunks/phd-*), skipping
# finished chunks, then joins them. Safe to rerun after an interruption: it picks up where it stopped.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out/chunks
DUR=263; STEP=5
list=out/chunks/phd-list.txt; : > "$list"
for ((s = 0; s < DUR; s += STEP)); do
  e=$((s + STEP > DUR ? DUR : s + STEP))
  f=phd-$(printf %03d $s).mp4
  # headless Chromium now and then drops the stage element mid-chunk; retry the chunk instead of stopping the run
  for try in 1 2 3; do
    [ -f out/chunks/$f ] && break
    rm -f out/chunks/$f.part
    Q=ao=8 node render.mjs h --page install-phd.html --dpr 1.3333334 --gl 1 --from $s --to $e --name chunks/$f || echo "chunk $f failed (try $try)"
  done
  [ -f out/chunks/$f ]
  echo "file '$f'" >> "$list"
done
ffmpeg -y -loglevel error -f concat -safe 0 -i "$list" -c copy -movflags +faststart out/install-phenolic-1440p.mp4
echo "wrote out/install-phenolic-1440p.mp4"
