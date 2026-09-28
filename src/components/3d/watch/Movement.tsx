"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { gearGeometry, plateGeometry, hairspringGeometry, rotorGeometry, rotorRimGeometry } from "./geometry";
import { useWatch } from "./context";
import { sceneCurrent } from "@/lib/sceneState";

/** Shared rotor physics — the interaction rig kicks it when the watch is dragged. */
export const rotorState = { angle: 0.6, velocity: 0 };
const movementCache = new Map<number, Record<string, THREE.BufferGeometry>>();

export function kickRotor(v: number) {
  rotorState.velocity += v;
}

/** Rotor: damped pendulum + kicks from interaction, only when exposed. Shared by the procedural and GLB rotors. */
export function stepRotor(delta: number) {
  const dt = Math.min(delta, 1 / 30);
  const visible = Math.abs(((sceneCurrent.yaw % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI) < 1.6 || sceneCurrent.explode > 0.1;
  const gravity = visible ? -Math.sin(rotorState.angle) * 1.6 : 0;
  rotorState.velocity += gravity * dt;
  rotorState.velocity *= Math.exp(-0.9 * dt);
  rotorState.angle += rotorState.velocity * dt;
}

/**
 * Calibre VX-01: mainplate, bridges with anglage, gear train, barrel,
 * balance with hairspring, jewels in gold chatons, blued screws.
 * Everything below z = 0 is what the exhibition caseback shows.
 */
export function Movement({ detail = 1, rotorRef }: { detail?: number; rotorRef?: React.Ref<THREE.Group> }) {
  const { materials: m, watch } = useWatch();
  const skeleton = watch.arch.dialStyle === "skeleton";
  const balance = useRef<THREE.Group>(null);
  const escape = useRef<THREE.Mesh>(null);
  const wheels = useRef<THREE.Group>(null);

  const G = useMemo(() => {
    const cached = movementCache.get(detail);
    if (cached) return cached as ReturnType<typeof build>;
    const built = build();
    movementCache.set(detail, built);
    return built;
    function build() {
    const mainplate = new THREE.CylinderGeometry(0.78, 0.78, 0.06, 128).rotateX(Math.PI / 2);
    const barrelBridge = plateGeometry(
      [
        [-0.72, 0.08],
        [-0.6, 0.55],
        [-0.25, 0.74],
        [0.3, 0.7],
        [0.56, 0.42],
        [0.34, 0.14],
        [-0.05, 0.05],
        [-0.45, -0.02],
      ],
      0.05,
      { holes: [[0, 0.38, 0.045], [0.42, 0.36, 0.028]] },
    );
    const trainBridge = plateGeometry(
      [
        [0.36, 0.02],
        [0.66, 0.12],
        [0.77, -0.16],
        [0.62, -0.52],
        [0.32, -0.66],
        [0.1, -0.44],
        [0.14, -0.14],
      ],
      0.05,
      { holes: [[0.36, -0.2, 0.03], [0.2, -0.5, 0.028]] },
    );
    const balanceCock = plateGeometry(
      [
        [-0.06, -0.12],
        [0.02, -0.34],
        [-0.14, -0.66],
        [-0.46, -0.75],
        [-0.68, -0.52],
        [-0.66, -0.24],
        [-0.42, -0.16],
      ],
      0.045,
      { holes: [[-0.4, -0.42, 0.03]] },
    );
    const barrel = new THREE.CylinderGeometry(0.255, 0.255, 0.045, 96).rotateX(Math.PI / 2);
    const barrelTeeth = gearGeometry(0.275, 84, 0.016, { toothDepth: 0.012 });
    const centerWheel = gearGeometry(0.2, 64, 0.014, { toothDepth: 0.012, hole: 0.02, spokes: 5 });
    const thirdWheel = gearGeometry(0.15, 48, 0.012, { toothDepth: 0.011, hole: 0.016, spokes: 4 });
    const fourthWheel = gearGeometry(0.13, 40, 0.012, { toothDepth: 0.011, hole: 0.014, spokes: 4 });
    const escapeWheel = gearGeometry(0.09, 15, 0.01, { toothDepth: 0.02, hole: 0.012 });
    const ratchet = gearGeometry(0.235, 60, 0.018, { toothDepth: 0.014, hole: 0.03, bevel: 0.004 });
    const crownWheel = gearGeometry(0.125, 32, 0.016, { toothDepth: 0.012, hole: 0.02, bevel: 0.003 });
    const balanceRim = new THREE.TorusGeometry(0.205, 0.017, 12, 64);
    const spoke = new THREE.BoxGeometry(0.4, 0.022, 0.012);
    const hairspring = hairspringGeometry(8, 0.15, 0.003);
    const jewel = new THREE.CylinderGeometry(0.03, 0.03, 0.014, 24).rotateX(Math.PI / 2);
    const chaton = new THREE.TorusGeometry(0.041, 0.011, 8, 32);
    const screw = new THREE.CylinderGeometry(0.028, 0.028, 0.012, 24).rotateX(Math.PI / 2);
    const slot = new THREE.BoxGeometry(0.046, 0.006, 0.005);
    const rotor = rotorGeometry(0.71, 0.022);
    const rotorRim = rotorRimGeometry(0.58, 0.735, 0.05);
    const bearing = new THREE.CylinderGeometry(0.1, 0.1, 0.03, 48).rotateX(Math.PI / 2);
    const bearingScrew = new THREE.CylinderGeometry(0.04, 0.04, 0.012, 24).rotateX(Math.PI / 2);
    const pillar = new THREE.CylinderGeometry(0.03, 0.03, 0.12, 12).rotateX(Math.PI / 2);
    // front works (visible through a skeleton dial)
    const frontBridge = plateGeometry(
      [
        [-0.42, -0.06],
        [-0.3, 0.3],
        [0.05, 0.4],
        [0.38, 0.22],
        [0.42, -0.12],
        [0.18, -0.36],
        [-0.18, -0.34],
      ],
      0.035,
      { holes: [[0, 0, 0.05], [0.24, 0.1, 0.028], [-0.22, -0.16, 0.026]] },
    );
    const frontWheel = gearGeometry(0.3, 72, 0.012, { toothDepth: 0.012, hole: 0.02, spokes: 5 });
    const frontSmall = gearGeometry(0.16, 40, 0.012, { toothDepth: 0.011, hole: 0.016, spokes: 4 });
    return {
      frontBridge, frontWheel, frontSmall,
      mainplate, barrelBridge, trainBridge, balanceCock, barrel, barrelTeeth, centerWheel, thirdWheel, fourthWheel,
      escapeWheel, ratchet, crownWheel, balanceRim, spoke, hairspring, jewel, chaton, screw, slot, rotor, rotorRim, bearing, bearingScrew, pillar,
    };
    }
  }, [detail]);


  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (balance.current) balance.current.rotation.z = Math.sin(t * Math.PI * 2 * 4) * 0.72;
    if (escape.current) escape.current.rotation.z = -Math.floor(t * 8) * ((Math.PI * 2) / 15 / 2);
    if (wheels.current) {
      wheels.current.children.forEach((c, i) => {
        c.rotation.z = t * [0.04, -0.12, 0.35, -0.6][i % 4];
      });
    }
    stepRotor(delta);
  });

  const jewels: [number, number][] = [
    [0, 0.38],
    [0.42, 0.36],
    [0.36, -0.2],
    [0.2, -0.5],
    [-0.4, -0.42],
    [0, 0],
  ];
  const screws: [number, number][] = [
    [-0.62, 0.36],
    [-0.1, 0.66],
    [0.44, 0.58],
    [0.62, 0.02],
    [0.52, -0.48],
    [0.2, -0.62],
    [-0.5, -0.66],
    [-0.6, -0.3],
  ];

  return (
    <group>
      {/* mainplate */}
      <mesh geometry={G.mainplate} material={[m.darkSteel, m.perlage, m.perlage]} position={[0, 0, 0]} />

      {/* gear train (layer under the bridges) */}
      <group ref={wheels}>
        <mesh geometry={G.centerWheel} material={m.gold} position={[0, 0, -0.07]} />
        <mesh geometry={G.thirdWheel} material={m.gold} position={[0.36, -0.2, -0.07]} />
        <mesh geometry={G.fourthWheel} material={m.gold} position={[0.2, -0.5, -0.07]} />
        <mesh geometry={G.barrelTeeth} material={m.rhodium} position={[0, 0.38, -0.07]} />
      </group>
      <mesh geometry={G.barrel} material={m.rhodium} position={[0, 0.38, -0.062]} />
      <mesh ref={escape} geometry={G.escapeWheel} material={m.rhodium} position={[-0.12, -0.56, -0.075]} />

      {/* bridges */}
      <mesh geometry={G.barrelBridge} material={m.rhodium} position={[0, 0, -0.125]} />
      <mesh geometry={G.trainBridge} material={m.rhodium} position={[0, 0, -0.125]} />
      <mesh geometry={G.balanceCock} material={m.rhodium} position={[0, 0, -0.125]} />

      {/* keyless works on the bridge */}
      <mesh geometry={G.ratchet} material={m.rhodium} position={[0, 0.38, -0.165]} />
      <mesh geometry={G.crownWheel} material={m.rhodium} position={[0.42, 0.36, -0.165]} />

      {/* balance */}
      <group ref={balance} position={[-0.4, -0.42, -0.19]}>
        <mesh geometry={G.balanceRim} material={m.gold} />
        <mesh geometry={G.spoke} material={m.gold} />
        <mesh geometry={G.spoke} material={m.gold} rotation={[0, 0, Math.PI / 3]} />
        <mesh geometry={G.spoke} material={m.gold} rotation={[0, 0, -Math.PI / 3]} />
        {detail >= 0.75 && <mesh geometry={G.hairspring} material={m.bluedSteel} position={[0, 0, 0.03]} />}
      </group>
      <mesh geometry={G.pillar} material={m.rhodium} position={[-0.4, -0.42, -0.12]} />

      {/* jewels in chatons */}
      {jewels.map(([x, y], i) => (
        <group key={i} position={[x, y, -0.156]}>
          <mesh geometry={G.jewel} material={m.jewel} />
          <mesh geometry={G.chaton} material={m.gold} />
        </group>
      ))}

      {/* blued screws */}
      {screws.map(([x, y], i) => (
        <group key={i} position={[x, y, -0.156]} rotation={[0, 0, (i * 1.3) % Math.PI]}>
          <mesh geometry={G.screw} material={m.bluedSteel} />
          <mesh geometry={G.slot} material={m.darkSteel} position={[0, 0, -0.006]} />
        </group>
      ))}

      {/* front works, seen through a skeletonized dial */}
      {skeleton && (
        <group>
          <mesh geometry={G.frontWheel} material={m.gold} position={[0, 0, 0.055]} rotation={[0, 0, 0.3]} />
          <mesh geometry={G.frontSmall} material={m.rhodium} position={[0.24, 0.1, 0.075]} />
          <mesh geometry={G.frontSmall} material={m.rhodium} position={[-0.22, -0.16, 0.075]} rotation={[0, 0, 0.5]} />
          <mesh geometry={G.frontBridge} material={m.rhodium} position={[0, 0, 0.1]} />
          {[[0, 0], [0.24, 0.1], [-0.22, -0.16]].map(([x, y], i) => (
            <group key={i} position={[x, y, 0.125]}>
              <mesh geometry={G.jewel} material={m.jewel} />
              <mesh geometry={G.chaton} material={m.gold} />
            </group>
          ))}
        </group>
      )}

      {/* rotor sits in its own group so it can explode separately */}
      <Rotor geo={G} anchorRef={rotorRef} />
    </group>
  );
}

function Rotor({ geo, anchorRef }: { geo: { rotor: THREE.BufferGeometry; rotorRim: THREE.BufferGeometry; bearing: THREE.BufferGeometry; bearingScrew: THREE.BufferGeometry }; anchorRef?: React.Ref<THREE.Group> }) {
  const { materials: m } = useWatch();
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) g.current.rotation.z = rotorState.angle;
  });
  return (
    <group name="rotor-anchor" ref={anchorRef}>
      <group ref={g} position={[0, 0, -0.235]}>
        <mesh geometry={geo.rotor} material={m.rhodium} />
        <mesh geometry={geo.rotorRim} material={m.tungsten} position={[0, 0, -0.012]} />
        <mesh geometry={geo.bearing} material={m.gold} position={[0, 0, 0]} />
        <mesh geometry={geo.bearingScrew} material={m.bluedSteel} position={[0, 0, -0.02]} />
      </group>
    </group>
  );
}
