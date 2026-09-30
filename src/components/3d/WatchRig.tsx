"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { WatchModel } from "./watch/WatchModel";
import { kickRotor } from "./watch/Movement";
import { sceneCurrent } from "@/lib/sceneState";
import { rigState } from "./CameraRig";
import { useStore } from "@/lib/store";
import { useActiveWatch } from "@/hooks/useActiveWatch";
import { gsap } from "@/lib/gsap";
import { resolveWatch, type ResolvedWatch } from "@/lib/resolveWatch";
import { compileSteps, advance } from "@/lib/warm";
import { DEFAULT_HERITAGE, DEFAULT_WATCH } from "@/data/watches";
import { MODELS } from "@/data/watches/models";
import { loadGLB, glbStatus } from "./glb/loader";

interface PoolEntry {
  key: string;
  watch: ResolvedWatch;
  /** shader programs compiled off the main frame (compileAsync) — the entry may then be drawn once */
  compiled: boolean;
  warmed: boolean;
  used: number;
}

/**
 * Interaction + product transitions.
 *
 *  - pointer / touch drag rotates the object with inertia
 *  - when released it drifts, then eases back to the choreographed pose
 *  - subtle cursor parallax on desktop, a slow idle "breath"
 *  - product changes within a family morph the live materials in place;
 *    geometry-level changes (family, strap construction) happen inside a
 *    short cinematic dip: the light falls, the object turns, and the next
 *    product arrives on the same turn.
 */
const it = {
  userYaw: 0,
  userPitch: 0,
  velYaw: 0,
  velPitch: 0,
  dragging: false,
  lastX: 0,
  lastY: 0,
  lastT: 0,
  releasedAt: -1,
  parX: 0,
  parY: 0,
  targetParX: 0,
  targetParY: 0,
};

export function WatchRig() {
  const group = useRef<THREE.Group>(null);
  const gl = useThree((s) => s.gl);
  const setHovering = useStore((s) => s.setHoveringWatch);
  const setDragging = useStore((s) => s.setDragging);
  const isTouch = useStore((s) => s.isTouch);
  const reduced = useStore((s) => s.reducedMotion);
  const thumbMode = useStore((s) => s.thumbMode);

  // ---- product on stage, with transitions -----------------------------
  const resolved = useActiveWatch();
  const [shown, setShown] = useState<ResolvedWatch>(resolved);

  // A small pool of mounted watches keyed by geometry. A switch toggles
  // visibility instead of remounting; entries that have never been drawn
  // are rendered once at sub-pixel scale so their textures, buffers and
  // programs are warm before they are ever needed on stage.
  const [pool, setPool] = useState<PoolEntry[]>(() => [{ key: resolved.geometryKey, watch: resolved, compiled: true, warmed: true, used: 0 }]);
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const groups = useRef<Record<string, THREE.Group | null>>({});
  const compiling = useRef(new Map<string, Generator<void, void, void>>());
  const tick = useRef(0);
  useEffect(() => {
    setPool((prev) => {
      const now = ++tick.current;
      const i = prev.findIndex((e) => e.key === shown.geometryKey);
      if (i >= 0) return prev.map((e, j) => (j === i ? { ...e, watch: shown, used: now } : e));
      const next = [...prev, { key: shown.geometryKey, watch: shown, compiled: false, warmed: false, used: now }];
      // keep the pool small: drop the least recently used inactive entry
      while (next.length > 3) {
        const idx = next.filter((e) => e.key !== shown.geometryKey).sort((a, b) => a.used - b.used)[0];
        next.splice(next.indexOf(idx), 1);
      }
      return next;
    });
  }, [shown]);
  // pre-build the other family. Its procedural sibling costs no download, so it is always built immediately,
  // under the preloader, where the warm-up compiles it. A sibling that has a real asset additionally fetches and
  // parses its files a few seconds after the intro, during idle time, and joins the pool only once they are ready:
  // mounting it earlier would build a second procedural fallback right after the intro (measured as 4–7 frame
  // stalls of 50–170 ms on the Legacy pages once Heritage had an asset of its own).
  const introDone = useStore((s) => s.introDone);
  useEffect(() => {
    if (thumbMode) return;
    const st = useStore.getState();
    const ctx = { quality: st.quality, glbDegraded: st.glbDegraded, thumbMode: st.thumbMode };
    const otherId = shown.def.family === "heritage" ? DEFAULT_WATCH.id : DEFAULT_HERITAGE.id;
    const other = resolveWatch(otherId, {}, ctx);
    const add = (w: ResolvedWatch) => setPool((prev) => (prev.some((e) => e.key === w.geometryKey) ? prev : [...prev, { key: w.geometryKey, watch: w, compiled: false, warmed: false, used: 0 }]));
    add(other.modelType === "procedural" ? other : resolveWatch(otherId, {}, { ...ctx, forceProcedural: true }));
    if (other.modelType === "procedural" || !introDone) return;
    const model = MODELS[other.arch.id];
    const urls = model ? [model.head, ...(model.straps[other.strap.kind] ? [model.straps[other.strap.kind] as string] : [])] : [];
    let cancelled = false;
    let idle: number | undefined;
    const hasIdle = "requestIdleCallback" in window;
    const timer = window.setTimeout(() => {
      const fetchAll = () => {
        Promise.all(urls.map((u) => loadGLB(u).promise)).then(() => {
          if (!cancelled && urls.every((u) => glbStatus(u) === "ready")) add(other);
        });
      };
      idle = hasIdle ? window.requestIdleCallback(fetchAll, { timeout: 1500 }) : window.setTimeout(fetchAll, 0);
    }, 3000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (idle !== undefined) {
        if (hasIdle) window.cancelIdleCallback(idle);
        else clearTimeout(idle);
      }
    };
    // once per family on stage
  }, [introDone, thumbMode, shown.def.family]);
  // warming, in two steps: programs are compiled a few meshes per frame while the entry sits
  // off-screen (no draw, no stall), then it is drawn tiny for a few frames so its textures upload
  const warmFrames = useRef<Record<string, number>>({});
  useFrame(() => {
    let changed = false;
    for (const e of pool) {
      if (e.compiled || e.key === shown.geometryKey) continue;
      const g = groups.current[e.key];
      if (!g) continue;
      let it = compiling.current.get(e.key);
      if (!it) {
        it = compileSteps(g, camera, scene, gl);
        compiling.current.set(e.key, it);
      }
      if (advance(it, 2)) {
        compiling.current.delete(e.key);
        setPool((prev) => prev.map((x) => (x.key === e.key ? { ...x, compiled: true } : x)));
      }
    }
    for (const e of pool) {
      if (e.warmed || !e.compiled || e.key === shown.geometryKey) continue;
      warmFrames.current[e.key] = (warmFrames.current[e.key] ?? 0) + 1;
      if (warmFrames.current[e.key] >= 4) changed = true;
    }
    if (changed) setPool((prev) => prev.map((e) => (!e.warmed && e.compiled && e.key !== shown.geometryKey && (warmFrames.current[e.key] ?? 0) >= 4 ? { ...e, warmed: true } : e)));
  });
  // The transition owns its own lifetime: it is only ever killed by a newer
  // transition or by unmount — never by the state change it causes itself.
  // `target` is always the latest product asked for, so a dip that is
  // already on its way swaps to wherever the request ended up, and a request
  // that returns to the object already on stage abandons the dip instead of
  // letting it land on a product nobody asked for any more (the hero label
  // said Legacy while Heritage sat on stage).
  const shownRef = useRef<ResolvedWatch>(resolved);
  const target = useRef<ResolvedWatch>(resolved);
  const pending = useRef<gsap.core.Animation | null>(null);
  useEffect(() => {
    target.current = resolved;
    const current = shownRef.current;
    if (resolved === current) return;
    if (resolved.geometryKey === current.geometryKey) {
      // same geometry as the object on stage: swap next frame, the materials tween inside the mounted model
      shownRef.current = resolved;
      gsap.delayedCall(0, () => {
        if (shownRef.current === resolved) setShown(resolved);
      });
      if (pending.current) {
        // a dip towards a different object is no longer wanted: bring the light back where it is
        pending.current.kill();
        pending.current = gsap.to(rigState, {
          dim: 1,
          spin: 0,
          duration: reduced || thumbMode ? 0.01 : 0.5,
          ease: "power3.out",
          onComplete: () => {
            pending.current = null;
          },
        });
      }
      return;
    }
    pending.current?.kill();
    const dur = reduced || thumbMode ? 0.01 : 1;
    const tl = gsap.timeline({
      onComplete: () => {
        pending.current = null;
      },
    });
    tl.to(rigState, { dim: 0.06, spin: 0.5 * dur, duration: 0.35 * dur, ease: "power2.in" })
      .add(() => {
        const next = target.current;
        shownRef.current = next;
        setShown(next);
        rigState.spin = -0.5 * dur;
      })
      .to(rigState, { dim: 1, spin: 0, duration: 0.85 * dur, ease: "power3.out" });
    pending.current = tl;
  }, [resolved, reduced, thumbMode]);
  useEffect(
    () => () => {
      pending.current?.kill();
      rigState.dim = 1;
      rigState.spin = 0;
    },
    [],
  );

  // Parallax from pointer position (desktop only)
  useEffect(() => {
    if (isTouch || reduced) return;
    const onMove = (e: PointerEvent) => {
      it.targetParX = (e.clientX / window.innerWidth) * 2 - 1;
      it.targetParY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [isTouch, reduced]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!it.dragging) return;
      const now = performance.now();
      const dt = Math.max(1, now - it.lastT) / 1000;
      const dx = e.clientX - it.lastX;
      const dy = e.clientY - it.lastY;
      const dYaw = dx * 0.0065;
      const dPitch = dy * 0.005;
      it.userYaw += dYaw;
      it.userPitch = THREE.MathUtils.clamp(it.userPitch + dPitch, -0.9, 0.9);
      it.velYaw = THREE.MathUtils.lerp(it.velYaw, dYaw / dt, 0.4);
      it.velPitch = THREE.MathUtils.lerp(it.velPitch, dPitch / dt, 0.4);
      kickRotor(-dYaw * 6);
      it.lastX = e.clientX;
      it.lastY = e.clientY;
      it.lastT = now;
    };
    const onUp = () => {
      if (!it.dragging) return;
      it.dragging = false;
      it.releasedAt = performance.now();
      setDragging(false);
      useStore.getState().setCursor(useStore.getState().hoveringWatch ? "rotate" : "default");
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [setDragging]);

  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (!useStore.getState().introDone) return;
    e.stopPropagation();
    it.dragging = true;
    it.lastX = e.clientX;
    it.lastY = e.clientY;
    it.lastT = performance.now();
    it.velYaw = 0;
    it.velPitch = 0;
    setDragging(true);
    useStore.getState().setCursor("drag");
  };
  const onOver = () => {
    if (isTouch) return;
    setHovering(true);
    if (!it.dragging) useStore.getState().setCursor("rotate");
    gl.domElement.style.touchAction = "none";
  };
  const onOut = () => {
    if (isTouch) return;
    setHovering(false);
    if (!it.dragging) useStore.getState().setCursor("default");
  };

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 1 / 20);
    const t = state.clock.elapsedTime;

    if (!it.dragging) {
      it.userYaw += it.velYaw * dt;
      it.userPitch += it.velPitch * dt;
      const decay = Math.exp(-2.6 * dt);
      it.velYaw *= decay;
      it.velPitch *= decay;
      const since = (performance.now() - it.releasedAt) / 1000;
      if (since > 0.9) {
        const k = 1 - Math.exp(-1.6 * dt);
        it.userYaw += (0 - it.userYaw) * k;
        it.userPitch += (0 - it.userPitch) * k;
      }
    }
    // pointer parallax settles in ~170 ms: attached to the hand, with a little weight
    const pk = 1 - Math.exp(-6 * dt);
    it.parX += (it.targetParX - it.parX) * pk;
    it.parY += (it.targetParY - it.parY) * pk;

    const idle = thumbMode ? 0 : (1 - sceneCurrent.flat) * (reduced ? 0.3 : 1);
    const idleYaw = Math.sin(t * 0.33) * 0.045 * idle;
    const idlePitch = Math.sin(t * 0.21 + 1.3) * 0.028 * idle;
    const floatY = Math.sin(t * 0.5) * 0.012 * idle;

    g.rotation.set(
      sceneCurrent.pitch + it.userPitch + idlePitch + it.parY * 0.05 * (1 - sceneCurrent.flat),
      sceneCurrent.yaw + it.userYaw + idleYaw + rigState.spin + it.parX * 0.07 * (1 - sceneCurrent.flat),
      sceneCurrent.roll,
    );
    g.position.y = floatY;
  });

  return (
    <group ref={group}>
      {pool.map((e) => {
        const active = e.key === shown.geometryKey;
        const warming = !active && !e.warmed;
        // compiling: visible (compile only walks visible objects) but far outside the frustum, so nothing draws yet
        const offscreen = warming && !e.compiled;
        return (
          <group
            key={e.key}
            ref={(g) => {
              groups.current[e.key] = g;
            }}
            visible={active || warming}
            scale={warming ? 0.001 : 1}
            position={offscreen ? [0, 200, 0] : warming ? [0, 0.4, -1.2] : [0, 0, 0]}
          >
            <WatchModel watch={active ? shown : e.watch} labels={active} />
          </group>
        );
      })}
      <mesh onPointerDown={onDown} onPointerOver={onOver} onPointerOut={onOut} visible={false}>
        <sphereGeometry args={[1.55 * shown.arch.radius, 16, 12]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}
