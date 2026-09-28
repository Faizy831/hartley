#!/bin/zsh
# Post-process the raw Blender GLBs from build.py: texture resize (dial 2K, everything else 1K) → WebP, dedup/prune,
# Draco. No tangent handling: Heritage has no anisotropic material.
set -e
GT=${GT:-"npx --yes @gltf-transform/cli@4"}  # or point GT at a local node_modules/.bin/gltf-transform
REPO=${VELORIS_REPO:-$(cd "$(dirname "$0")/../../.." && pwd)}; SRC=$REPO/public/models/heritage; TMP=${TMPDIR:-/tmp}/heritage-glb; mkdir -p $TMP
for f in heritage-head straps/leather-black straps/mesh-silver; do
  b=$(basename $f); in=$TMP/$b.blender.glb
  # keep the raw Blender export as the pipeline source; never overwrite it with an already processed file
  if ! grep -q "EXT_texture_webp" $SRC/$f.glb; then cp $SRC/$f.glb $in; fi
  if [ ! -f $in ]; then echo "no raw export for $f (run build.py first)"; exit 1; fi
  $GT resize --width 2048 --height 2048 --pattern "^Dial_" $in $TMP/h1.glb 2>&1 | grep -v warn | tail -1
  $GT resize --width 1024 --height 1024 --pattern "^(?!Dial_)" $TMP/h1.glb $TMP/h2.glb 2>&1 | grep -v warn | tail -1
  $GT webp --quality 88 --slots "{baseColor,metallicRoughness}Texture" $TMP/h2.glb $TMP/h3.glb 2>&1 | grep -v warn | tail -1
  $GT webp --quality 92 --slots "normalTexture" $TMP/h3.glb $TMP/h4.glb 2>&1 | grep -v warn | tail -1
  # materials stay separate: identical-looking families (Case_Polished / Indices / Hands / Crown_Polished) carry different finish roles
  $GT dedup --materials false $TMP/h4.glb $TMP/h5.glb 2>&1 | grep -v warn | tail -1
  $GT prune $TMP/h5.glb $TMP/h6.glb 2>&1 | grep -v warn | tail -1
  # no resample: it collapsed the 181-key linear turn to 4 keys (180° apart → ambiguous slerp); 181 keys cost ~4 KB
  $GT draco --method edgebreaker --quantize-position 14 --quantize-normal 10 --quantize-texcoord 12 $TMP/h6.glb $SRC/$f.glb 2>&1 | grep -v warn | tail -1
  ls -la $SRC/$f.glb
done
