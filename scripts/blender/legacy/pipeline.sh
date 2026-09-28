#!/bin/zsh
# Post-process the raw Blender GLBs: 2K textures → WebP, 16-bit normal amplification, dedup/prune/resample, tangent pruning + quantisation, Draco.
set -e; GT="npx --yes @gltf-transform/cli@4"  # needs: npm i -D @gltf-transform/cli @gltf-transform/core @gltf-transform/extensions sharp pngjs; REPO=${VELORIS_REPO:-$(cd "$(dirname "$0")/../../.." && pwd)}; SRC=$REPO/public/models/legacy; TMP=${TMPDIR:-/tmp}/legacy-glb; mkdir -p $TMP
for f in legacy-head straps/steel-bracelet; do
  b=$(basename $f); in=$TMP/$b.blender.glb
  # keep the raw Blender export as the pipeline source; never overwrite it with an already processed file
  if ! grep -q "EXT_texture_webp" $SRC/$f.glb; then cp $SRC/$f.glb $in; fi
  if [ ! -f $in ]; then echo "no raw export for $f (run build.py first)"; exit 1; fi
  $GT resize --width 2048 --height 2048 $in $TMP/gt1.glb 2>&1 | grep -v warn | tail -1
  node "$(dirname "$0")/fixnormals.mjs" $in $TMP/gt1.glb $TMP/gt2.glb
  $GT webp --quality 88 --slots "{baseColor,metallicRoughness}Texture" $TMP/gt2.glb $TMP/gt3.glb 2>&1 | grep -v warn | tail -1
  $GT webp --quality 92 --slots "normalTexture" $TMP/gt3.glb $TMP/gt4.glb 2>&1 | grep -v warn | tail -1
  $GT dedup $TMP/gt4.glb $TMP/gt5.glb 2>&1 | grep -v warn | tail -1
  $GT prune $TMP/gt5.glb $TMP/gt6.glb 2>&1 | grep -v warn | tail -1
  $GT resample --tolerance 0.0001 $TMP/gt6.glb $TMP/gt7.glb 2>&1 | grep -v warn | tail -1
  node "$(dirname "$0")/prunetangents.mjs" $TMP/gt7.glb $TMP/gt8.glb
  # Draco leaves TANGENT uncompressed; store the kept tangents as normalised 8-bit (KHR_mesh_quantization)
  $GT quantize --pattern "TANGENT" --quantize-normal 8 $TMP/gt8.glb $TMP/gt8q.glb 2>&1 | grep -v warn | tail -1; mv $TMP/gt8q.glb $TMP/gt8.glb
  $GT draco --method edgebreaker --quantize-position 14 --quantize-normal 10 --quantize-texcoord 12 $TMP/gt8.glb $SRC/$f.glb 2>&1 | grep -v warn | tail -1
done
