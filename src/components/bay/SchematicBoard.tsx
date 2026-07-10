"use client";

// ---------------------------------------------------------------------------
// Manifold circuit sheet — a dense procedural PCB rendered in 3D.
// Sixty-plus Manhattan-routed traces, via fields, SMD banks and IC packages
// are generated from a seeded RNG (stable across builds). Signal pulses run
// the live nets, a diagnostic sweep pans the board, and the whole assembly
// tilts toward the pointer like a board on a inspection jig.
// ---------------------------------------------------------------------------

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Edges,
  Environment,
  Html,
  Lightformer,
  Line,
  OrbitControls,
  PerspectiveCamera,
  RoundedBox,
} from "@react-three/drei";
import { damp, damp3 } from "maath/easing";
import { useReducedMotion } from "framer-motion";
import useDocTheme from "./useDocTheme";
import { useDemandLoop, DemandDriver } from "./useDemandLoop";
import { BOARD_ICS, type BoardIcId } from "./board-data";
import IcDetailPanel from "./IcDetailPanel";
import { BoardZoomControls } from "./BoardZoomControls";

const BOARD_W = 7.2;
const BOARD_D = 4.7;
const SURF = 0.075; // top surface height
const BOARD_CAMERA_TARGET = new THREE.Vector3(0, 0, -0.2);
const BOARD_CAMERA_POSITION = new THREE.Vector3(0, 5.7, 5.1);
const BOARD_CAMERA_DISTANCE = BOARD_CAMERA_POSITION.distanceTo(BOARD_CAMERA_TARGET);
const MIN_ZOOM_PCT = 70;
const MAX_ZOOM_PCT = 160;
const ZOOM_STEP_PCT = 15;
const DEFAULT_ZOOM_PCT = 100;

/** Deterministic RNG — the board must not change between builds. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Trace {
  points: THREE.Vector3[];
  live: boolean;
  /** Cumulative segment lengths for pulse animation. */
  lengths: number[];
  total: number;
}

function buildTraces(): Trace[] {
  const rnd = mulberry32(20260708);
  const traces: Trace[] = [];
  const margin = 0.45;
  for (let i = 0; i < 66; i++) {
    const x0 = -BOARD_W / 2 + margin + rnd() * (BOARD_W - margin * 2);
    const z0 = -BOARD_D / 2 + margin + rnd() * (BOARD_D - margin * 2);
    const pts: THREE.Vector3[] = [new THREE.Vector3(x0, SURF, z0)];
    let x = x0;
    let z = z0;
    let horizontal = rnd() > 0.5;
    const bends = 2 + Math.floor(rnd() * 3);
    for (let b = 0; b < bends; b++) {
      const run = 0.35 + rnd() * 1.6;
      const dir = rnd() > 0.5 ? 1 : -1;
      if (horizontal) x = THREE.MathUtils.clamp(x + run * dir, -BOARD_W / 2 + margin, BOARD_W / 2 - margin);
      else z = THREE.MathUtils.clamp(z + run * dir, -BOARD_D / 2 + margin, BOARD_D / 2 - margin);
      // 45° chamfer at each corner, like real board routing.
      const prev = pts[pts.length - 1];
      const nx = horizontal ? THREE.MathUtils.lerp(prev.x, x, 0.85) : x;
      const nz = horizontal ? z : THREE.MathUtils.lerp(prev.z, z, 0.85);
      pts.push(new THREE.Vector3(nx, SURF, nz));
      pts.push(new THREE.Vector3(x, SURF, z));
      horizontal = !horizontal;
    }
    const lengths: number[] = [0];
    let total = 0;
    for (let p = 1; p < pts.length; p++) {
      total += pts[p].distanceTo(pts[p - 1]);
      lengths.push(total);
    }
    traces.push({ points: pts, live: i % 8 === 0, lengths, total });
  }
  return traces;
}

interface Smd {
  x: number;
  z: number;
  w: number;
  d: number;
  copper: boolean;
  rotY: number;
}

function buildSmds(): Smd[] {
  const rnd = mulberry32(19770519);
  const smds: Smd[] = [];
  for (let i = 0; i < 130; i++) {
    smds.push({
      x: (rnd() - 0.5) * (BOARD_W - 1),
      z: (rnd() - 0.5) * (BOARD_D - 1),
      w: 0.08 + rnd() * 0.12,
      d: 0.05 + rnd() * 0.07,
      copper: rnd() > 0.55,
      rotY: rnd() > 0.5 ? 0 : Math.PI / 2,
    });
  }
  return smds;
}

const TEST_POINTS = [
  { x: -2.9, z: 0.3, ref: "TP12", val: "3.82 V" },
  { x: 0.95, z: 1.7, ref: "TP07", val: "1.10 V" },
  { x: 2.85, z: -0.7, ref: "TP31", val: "19.6 Ω" },
] as const;

/** Pulses that travel the live nets. */
function Pulses({ traces }: { traces: Trace[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const live = useMemo(() => traces.filter((t) => t.live), [traces]);
  const state = useMemo(
    () => live.map((_, i) => ({ t: (i * 0.37) % 1, speed: 0.55 + (i % 3) * 0.3 })),
    [live],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const reduced = useReducedMotion();

  useFrame((_, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    live.forEach((trace, i) => {
      const s = state[i];
      if (!reduced) s.t = (s.t + (delta * s.speed) / trace.total) % 1;
      const dist = s.t * trace.total;
      let seg = 1;
      while (seg < trace.lengths.length - 1 && trace.lengths[seg] < dist) seg++;
      const segStart = trace.lengths[seg - 1];
      const segLen = trace.lengths[seg] - segStart || 1;
      const k = (dist - segStart) / segLen;
      dummy.position.lerpVectors(trace.points[seg - 1], trace.points[seg], k);
      dummy.position.y = SURF + 0.02;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, live.length]}>
      <sphereGeometry args={[0.045, 10, 10]} />
      <meshStandardMaterial
        color="#FF6B24"
        emissive="#F24C00"
        emissiveIntensity={2.2}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/** The diagnostic sweep bar panning the board. */
function Sweep() {
  const ref = useRef<THREE.Mesh>(null);
  const reduced = useReducedMotion();
  useFrame(({ clock }) => {
    if (!ref.current || reduced) return;
    const t = (clock.elapsedTime * 0.14) % 1.3;
    ref.current.position.x = -BOARD_W / 2 + t * BOARD_W;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = t > 1 ? 0 : 0.5 * Math.sin(Math.min(t, 1) * Math.PI) + 0.12;
  });
  return (
    <mesh ref={ref} position={[0, SURF + 0.09, 0]}>
      <boxGeometry args={[0.03, 0.02, BOARD_D]} />
      <meshBasicMaterial color="#F24C00" transparent opacity={0.4} toneMapped={false} />
    </mesh>
  );
}

const IC_SIGNAL = new THREE.Color("#F24C00");

/** One clickable IC package — highlight + tweezer-lift when selected. */
function IcPackage({
  ic,
  selected,
  onSelect,
  wake,
}: {
  ic: (typeof BOARD_ICS)[number];
  selected: boolean;
  onSelect: (id: BoardIcId) => void;
  wake: () => void;
}) {
  const grp = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const [hover, setHover] = useState(false);
  const active = hover || selected;
  const baseY = SURF + ic.h / 2;

  useFrame((_, delta) => {
    const m = mat.current;
    if (m)
      damp(
        m,
        "emissiveIntensity",
        selected ? 0.35 : hover ? 0.15 : 0,
        0.12,
        delta,
      );
    const g = grp.current;
    // Selected chip lifts slightly — picked up with tweezers.
    if (g) damp(g.position, "y", baseY + (selected ? 0.06 : 0), 0.14, delta);
  });

  return (
    <group
      ref={grp}
      position={[ic.x, baseY, ic.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(ic.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
        wake();
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHover(false);
        document.body.style.cursor = "auto";
        wake();
      }}
    >
      <RoundedBox args={[ic.w, ic.h, ic.d]} radius={0.02} smoothness={2}>
        <meshStandardMaterial
          ref={mat}
          color="#0D0C0A"
          metalness={0.5}
          roughness={0.35}
          emissive="#F24C00"
          emissiveIntensity={0}
        />
        <Edges visible={active} scale={1.003} threshold={20} color={IC_SIGNAL} />
      </RoundedBox>
      {/* pin rows */}
      <mesh position={[0, -ic.h / 2 + 0.01, 0]}>
        <boxGeometry args={[ic.w + 0.08, 0.02, ic.d + 0.08]} />
        <meshStandardMaterial color="#A9A395" metalness={0.95} roughness={0.25} />
      </mesh>
      <Html
        position={[0, ic.h / 2 + 0.02, ic.d / 2 + 0.12]}
        center
        zIndexRange={[20, 5]}
        style={{ pointerEvents: "none" }}
      >
        <span className="whitespace-nowrap font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-paper/90 [text-shadow:1px_1px_0_#161511]">
          {ic.ref}
        </span>
      </Html>
    </group>
  );
}

function Board({
  dark,
  selectedIc,
  onSelectIc,
  wake,
}: {
  dark: boolean;
  selectedIc: BoardIcId | null;
  onSelectIc: (id: BoardIcId) => void;
  wake: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  // Ink tones for linework lift slightly on the night bench so the board
  // still reads against the dark page.
  const silk = dark ? "#8B8778" : "#6E6A5C";
  const copperTrace = dark ? "#9A7448" : "#7A5A38";
  const traces = useMemo(buildTraces, []);
  const smds = useMemo(buildSmds, []);
  const reduced = useReducedMotion();

  useFrame(({ clock, pointer: p }, delta) => {
    const g = group.current;
    if (!g) return;
    const bob = reduced ? 0 : Math.sin(clock.elapsedTime * 0.6) * 0.05;
    damp3(g.position, [0, bob, 0], 0.6, delta);
    damp(g.rotation, "x", -0.12 + (reduced ? 0 : -p.y * 0.12), 0.5, delta);
    damp(g.rotation, "z", reduced ? 0 : p.x * 0.1, 0.5, delta);
    damp(g.rotation, "y", reduced ? 0 : p.x * 0.06, 0.6, delta);
  });

  // SMD instanced meshes (two materials — copper and dark packages).
  const smdMeshes = useMemo(() => {
    const geo = new THREE.BoxGeometry(1, 0.045, 1);
    const copperMat = new THREE.MeshStandardMaterial({
      color: "#B26E3A",
      metalness: 0.9,
      roughness: 0.3,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: "#0D0C0A",
      metalness: 0.4,
      roughness: 0.4,
    });
    const make = (list: Smd[], mat: THREE.MeshStandardMaterial) => {
      const mesh = new THREE.InstancedMesh(geo, mat, list.length);
      const dummy = new THREE.Object3D();
      list.forEach((s, i) => {
        dummy.position.set(s.x, SURF + 0.02, s.z);
        dummy.rotation.set(0, s.rotY, 0);
        dummy.scale.set(s.w, 1, s.d);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      return mesh;
    };
    return {
      copper: make(smds.filter((s) => s.copper), copperMat),
      dark: make(smds.filter((s) => !s.copper), darkMat),
    };
  }, [smds]);

  // Via field — endpoints of every trace. Hand-built instanced mesh; R3F 8
  // does not auto-dispose <primitive> objects, so it is torn down in the
  // disposal effect below alongside the SMD banks.
  const viaMesh = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    traces.forEach((t) => {
      pts.push(t.points[0], t.points[t.points.length - 1]);
    });
    const geo = new THREE.CylinderGeometry(0.028, 0.028, 0.02, 8);
    const mat = new THREE.MeshStandardMaterial({
      color: "#D9A167",
      metalness: 0.9,
      roughness: 0.35,
    });
    const mesh = new THREE.InstancedMesh(geo, mat, pts.length);
    const dummy = new THREE.Object3D();
    pts.forEach((p, i) => {
      dummy.position.set(p.x, SURF + 0.005, p.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, [traces]);

  useEffect(() => {
    return () => {
      smdMeshes.copper.geometry.dispose();
      (smdMeshes.copper.material as THREE.Material).dispose();
      (smdMeshes.dark.material as THREE.Material).dispose();
      viaMesh.geometry.dispose();
      (viaMesh.material as THREE.Material).dispose();
    };
  }, [smdMeshes, viaMesh]);

  return (
    <group ref={group} rotation={[-0.12, 0, 0]}>
      {/* Substrate */}
      <RoundedBox args={[BOARD_W, 0.14, BOARD_D]} radius={0.05} smoothness={2}>
        <meshStandardMaterial color="#201E18" metalness={0.25} roughness={0.62} />
      </RoundedBox>
      {/* Silk border */}
      <Line
        points={[
          [-BOARD_W / 2 + 0.18, SURF + 0.001, -BOARD_D / 2 + 0.18],
          [BOARD_W / 2 - 0.18, SURF + 0.001, -BOARD_D / 2 + 0.18],
          [BOARD_W / 2 - 0.18, SURF + 0.001, BOARD_D / 2 - 0.18],
          [-BOARD_W / 2 + 0.18, SURF + 0.001, BOARD_D / 2 - 0.18],
          [-BOARD_W / 2 + 0.18, SURF + 0.001, -BOARD_D / 2 + 0.18],
        ]}
        color={silk}
        lineWidth={1}
      />

      {/* Copper routing */}
      {traces.map((t, i) => (
        <Line
          key={i}
          points={t.points}
          color={t.live ? "#F24C00" : copperTrace}
          lineWidth={t.live ? 1.8 : 1}
          transparent
          opacity={t.live ? 0.95 : 0.55}
        />
      ))}
      <Pulses traces={traces} />
      <Sweep />

      {/* Via field — endpoints of every trace. */}
      <primitive object={viaMesh} />

      {/* SMD banks */}
      <primitive object={smdMeshes.copper} />
      <primitive object={smdMeshes.dark} />

      {/* IC packages with silk refs — clickable */}
      {BOARD_ICS.map((ic) => (
        <IcPackage
          key={ic.id}
          ic={ic}
          selected={selectedIc === ic.id}
          onSelect={onSelectIc}
          wake={wake}
        />
      ))}

      {/* Test points with live readouts */}
      {TEST_POINTS.map((tp) => (
        <group key={tp.ref} position={[tp.x, SURF, tp.z]}>
          <mesh>
            <cylinderGeometry args={[0.06, 0.06, 0.03, 12]} />
            <meshStandardMaterial
              color="#F24C00"
              emissive="#F24C00"
              emissiveIntensity={0.8}
            />
          </mesh>
          <Html
            position={[0, 0.3, 0]}
            center
            zIndexRange={[20, 5]}
            style={{ pointerEvents: "none" }}
          >
            <div className="whitespace-nowrap border border-carbon-950 bg-bone-50 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-carbon-950 shadow-hard-sm">
              {tp.ref} · <span className="text-signal-600">{tp.val}</span>
            </div>
          </Html>
        </group>
      ))}

      {/* Dimension lines along two edges */}
      <group position={[0, SURF, BOARD_D / 2 + 0.42]}>
        <Line
          points={[
            [-BOARD_W / 2, 0, 0],
            [BOARD_W / 2, 0, 0],
          ]}
          color={silk}
          lineWidth={1}
        />
        <Line points={[[-BOARD_W / 2, 0, -0.12], [-BOARD_W / 2, 0, 0.12]]} color={silk} lineWidth={1} />
        <Line points={[[BOARD_W / 2, 0, -0.12], [BOARD_W / 2, 0, 0.12]]} color={silk} lineWidth={1} />
        <Html position={[0, 0, 0.22]} center zIndexRange={[20, 5]} style={{ pointerEvents: "none" }}>
          <span className="whitespace-nowrap font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-carbon-500">
            162.0 MM
          </span>
        </Html>
      </group>
      <group position={[BOARD_W / 2 + 0.42, SURF, 0]}>
        <Line
          points={[
            [0, 0, -BOARD_D / 2],
            [0, 0, BOARD_D / 2],
          ]}
          color={silk}
          lineWidth={1}
        />
        <Line points={[[-0.12, 0, -BOARD_D / 2], [0.12, 0, -BOARD_D / 2]]} color={silk} lineWidth={1} />
        <Line points={[[-0.12, 0, BOARD_D / 2], [0.12, 0, BOARD_D / 2]]} color={silk} lineWidth={1} />
        <Html position={[0.3, 0, 0]} center zIndexRange={[20, 5]} style={{ pointerEvents: "none" }}>
          <span className="whitespace-nowrap font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-carbon-500">
            105.7 MM
          </span>
        </Html>
      </group>
    </group>
  );
}

function BoardCameraZoom({
  zoomPct,
  controlsRef,
  onInteract,
}: {
  readonly zoomPct: number;
  readonly controlsRef: MutableRefObject<OrbitControlsImpl | null>;
  readonly onInteract: () => void;
}) {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls || !(camera instanceof THREE.PerspectiveCamera)) return;

    const offset = camera.position.clone().sub(controls.target);
    if (offset.lengthSq() === 0) offset.copy(BOARD_CAMERA_POSITION).sub(BOARD_CAMERA_TARGET);
    offset.setLength(BOARD_CAMERA_DISTANCE * (DEFAULT_ZOOM_PCT / zoomPct));
    camera.position.copy(controls.target).add(offset);
    camera.updateProjectionMatrix();
    controls.update();
    onInteract();
  }, [camera, controlsRef, onInteract, zoomPct]);

  return null;
}

export default function SchematicBoard() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null);
  // Render immediately and let the observer PARK the loop when scrolled away —
  // failing safe (a delayed/absent observer must never leave the scene blank).
  // The eager-GL-context problem is handled by MountWhenNear in loaders.tsx.
  const [inView, setInView] = useState(true);
  const [zoomPct, setZoomPct] = useState(DEFAULT_ZOOM_PCT);
  const dark = useDocTheme() === "dark";
  const reduced = useReducedMotion();
  const demand = useDemandLoop();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        // Coming back into view: repaint the static board once (demand mode).
        if (entry.isIntersecting) demand.wake();
      },
      { rootMargin: "160px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [demand]);

  // Repaint when the theme flips — the board re-inks and, in demand mode,
  // nothing else would drive a frame.
  useEffect(() => {
    demand.wake();
  }, [dark, demand]);

  // IC selection + detail panel.
  const [selectedIc, setSelectedIc] = useState<BoardIcId | null>(null);
  const [icTab, setIcTab] = useState<"summary" | "tech">("summary");
  const legendRefs = useRef(new Map<string, HTMLButtonElement>());

  const wakeSelectIc = (id: BoardIcId) => {
    setSelectedIc((s) => (s === id ? null : id));
    setIcTab("summary");
    demand.wake();
  };
  const clearIc = () => {
    setSelectedIc(null);
    demand.wake();
  };
  const setZoom = (pct: number) => {
    setZoomPct(THREE.MathUtils.clamp(pct, MIN_ZOOM_PCT, MAX_ZOOM_PCT));
    demand.wake();
  };
  // Close from the panel: return focus to the matching legend chip so
  // keyboard users aren't dropped to <body>.
  const closePanel = () => {
    const id = selectedIc;
    clearIc();
    if (id) legendRefs.current.get(id)?.focus();
  };

  // ICs are hoverable now — restore the global cursor if we unmount mid-hover.
  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  const selectedIcData = selectedIc
    ? BOARD_ICS.find((i) => i.id === selectedIc) ?? null
    : null;

  return (
    <div ref={wrapRef} className="relative h-[440px] overflow-hidden sm:h-[520px]">
      <Canvas
        frameloop={!inView ? "never" : reduced ? "demand" : "always"}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={clearIc}
        aria-label="Interactive 3D schematic of a repaired logic board — select a chip to learn what it does"
        className="!absolute inset-0"
      >
        <DemandDriver bind={demand} />
        <PerspectiveCamera
          makeDefault
          position={BOARD_CAMERA_POSITION}
          fov={38}
          onUpdate={(c) => c.lookAt(0, 0, -0.2)}
        />
        <OrbitControls
          ref={orbitControlsRef}
          makeDefault
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI * 0.18}
          maxPolarAngle={Math.PI * 0.58}
          dampingFactor={0.08}
          target={BOARD_CAMERA_TARGET}
          onChange={demand.wake}
        />
        <BoardCameraZoom
          zoomPct={zoomPct}
          controlsRef={orbitControlsRef}
          onInteract={demand.wake}
        />
        <ambientLight intensity={0.75} color="#FFF4E4" />
        <directionalLight position={[4, 8, 3]} intensity={1.3} />
        <directionalLight position={[-5, 4, -3]} intensity={0.4} color="#FFD9BC" />
        {/* Procedural studio — no external HDR (CSP: connect-src 'self'). */}
        <Environment resolution={64} frames={1}>
          <Lightformer
            intensity={1.5}
            position={[0, 4, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[10, 10, 1]}
            color="#FFF4E2"
          />
          <Lightformer
            intensity={0.9}
            position={[-5, 1, 2]}
            rotation={[0, Math.PI / 2, 0]}
            scale={[8, 3, 1]}
            color="#FFFFFF"
          />
          <Lightformer
            intensity={0.7}
            position={[5, 0, -1]}
            rotation={[0, -Math.PI / 2, 0]}
            scale={[8, 3, 1]}
            color="#FFD9B8"
          />
        </Environment>
        <Board
          dark={dark}
          selectedIc={selectedIc}
          onSelectIc={wakeSelectIc}
          wake={demand.wake}
        />
      </Canvas>

      <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-3 text-carbon-500">
        <span className="mnl-reg" aria-hidden="true" />
        <span className="mnl-dim">BOARD-LEVEL · LIVE NETS</span>
      </div>
      <div className="pointer-events-none absolute bottom-4 right-4 hidden text-carbon-500 sm:block">
        <span className="mnl-dim">MICRO-SOLDERING BAY · CCR-K1 / ZOOM {zoomPct}%</span>
      </div>
      <BoardZoomControls
        zoomPct={zoomPct}
        canZoomIn={zoomPct < MAX_ZOOM_PCT}
        canZoomOut={zoomPct > MIN_ZOOM_PCT}
        onZoomIn={() => setZoom(zoomPct + ZOOM_STEP_PCT)}
        onZoomOut={() => setZoom(zoomPct - ZOOM_STEP_PCT)}
        onResetZoom={() => setZoom(DEFAULT_ZOOM_PCT)}
      />

      {/* IC legend — the keyboard/touch path to selection (3D meshes are
          unreachable by keyboard and tiny tap targets). */}
      <div
        className="absolute bottom-3 left-3 z-20 flex max-w-[75%] flex-wrap gap-1.5"
        role="group"
        aria-label="Board components"
      >
        {BOARD_ICS.map((ic) => (
          <button
            key={ic.id}
            ref={(el) => {
              if (el) legendRefs.current.set(ic.id, el);
              else legendRefs.current.delete(ic.id);
            }}
            type="button"
            className="mnl-chip px-2 py-1 text-[0.5625rem]"
            data-active={selectedIc === ic.id}
            aria-pressed={selectedIc === ic.id}
            title={`${ic.ref} — ${ic.name}`}
            onClick={() => wakeSelectIc(ic.id)}
          >
            {ic.ref.split(" · ")[0]}
          </button>
        ))}
      </div>

      {selectedIcData && (
        <IcDetailPanel
          ic={selectedIcData}
          tab={icTab}
          onTab={setIcTab}
          onClose={closePanel}
        />
      )}
    </div>
  );
}
