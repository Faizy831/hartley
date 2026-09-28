"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { sceneCurrent } from "@/lib/sceneState";

const GUTTER = 64;
const COLUMN = 250; // label block width
const ROW = 74; // vertical rhythm of the plates

/**
 * Technical plate for an exploded part.
 *
 * The anchor follows the part in 3D. The plate itself is laid out in a fixed
 * screen column (left or right of the object) on a fixed row, and an elbow
 * leader (horizontal + vertical hairline) connects it to the anchor — the
 * convention of engineering exhibits.
 */
export function ExplodedLabel({
  title,
  detail,
  side,
  row,
  rows = 4,
  y = 0,
  delay = 0,
}: {
  title: string;
  detail: string;
  side: 1 | -1;
  row: number;
  rows?: number;
  y?: number;
  delay?: number;
}) {
  const anchor = useRef<THREE.Group>(null);
  const el = useRef<HTMLDivElement>(null);
  const h = useRef<HTMLSpanElement>(null);
  const vline = useRef<HTMLSpanElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const node = el.current;
    const a = anchor.current;
    if (!node || !a) return;
    // stagger is compressed so every plate reaches full opacity before explode = 1
    const e = Math.max(0, Math.min(1, (sceneCurrent.explode - 0.5 - delay * 0.5) / 0.3));
    const eased = e * e * (3 - 2 * e);
    node.style.opacity = String(eased);
    if (eased === 0) return;

    a.getWorldPosition(v);
    v.project(camera);
    const ax = (v.x * 0.5 + 0.5) * size.width;
    const ay = (1 - (v.y * 0.5 + 0.5)) * size.height;

    // plate position in screen space
    const px = side === 1 ? size.width - GUTTER - COLUMN : GUTTER; // left edge of the plate
    const py = size.height * 0.5 + (row - (rows - 1) / 2) * ROW; // vertical centre of the plate
    const dx = px - ax;
    const dy = py - ay;
    node.style.transform = `translate(${dx + (1 - eased) * side * -16}px, ${dy}px)`;

    // elbow leader in the plate's local frame (origin = plate left edge, vertical centre)
    const lx = -dx; // anchor x in local coords
    const ly = -dy; // anchor y in local coords
    if (h.current) {
      const gap = 12;
      if (side === 1) {
        h.current.style.left = `${lx}px`;
        h.current.style.width = `${Math.max(0, -lx - gap)}px`;
      } else {
        h.current.style.left = `${COLUMN + gap}px`;
        h.current.style.width = `${Math.max(0, lx - COLUMN - gap)}px`;
      }
    }
    if (vline.current) {
      vline.current.style.left = `${lx}px`;
      vline.current.style.top = `${Math.min(0, ly)}px`;
      vline.current.style.height = `${Math.abs(ly)}px`;
    }
    if (dot.current) {
      dot.current.style.left = `${lx - 2.5}px`;
      dot.current.style.top = `${ly - 2.5}px`;
    }
  });

  return (
    <group ref={anchor} position={[0, y, 0]}>
      <Html center={false} zIndexRange={[3, 1]} style={{ pointerEvents: "none" }}>
        <div className="exploded-label" data-side={side === 1 ? "right" : "left"}>
          <div ref={el} className="exploded-label__inner" style={{ opacity: 0 }}>
            <span ref={h} className="exploded-label__line" />
            <span ref={vline} className="exploded-label__vline" />
            <span ref={dot} className="exploded-label__dot" />
            <span className="t-label">{title}</span>
            <span className="t-micro exploded-label__detail">{detail}</span>
          </div>
        </div>
      </Html>
    </group>
  );
}
