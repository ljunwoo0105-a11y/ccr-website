"use client";

// ---------------------------------------------------------------------------
// Manifold Teardown Bay — the interactive 3D rig on the landing sheet.
// Five procedurally-built devices tear down into selectable parts. Hover a
// part (in 3D or on the BOM table) to spotlight it; click to open its fault
// card; drag to orbit; X-RAY strips the shells to a line drawing.
// ---------------------------------------------------------------------------

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  ContactShadows,
  Edges,
  Environment,
  Grid,
  Html,
  Lightformer,
  OrbitControls,
  PerspectiveCamera,
  RoundedBox,
} from "@react-three/drei";
import { damp, damp3, dampC } from "maath/easing";
import { useReducedMotion } from "framer-motion";
import Link from "next/link";
import useDocTheme from "./useDocTheme";
import { useDemandLoop, DemandDriver } from "./useDemandLoop";
import { useDiagnosis, type RankInfo } from "./useDiagnosis";
import DiagnosePanel from "./DiagnosePanel";
import DiagnosisLinks from "./DiagnosisLinks";
import {
  DEVICES,
  getDevice,
  type DeviceDef,
  type Deco,
  type MaterialKey,
  type PartDef,
  type Shape,
  type Vec3,
} from "./rig-data";

// --- Material board ---------------------------------------------------------

const MATERIALS: Record<
  MaterialKey,
  { color: string; metalness: number; roughness: number; emissive?: string; emissiveIntensity?: number }
> = {
  housing: { color: "#D8D2C2", metalness: 0.85, roughness: 0.38 },
  housingDark: { color: "#3A372E", metalness: 0.55, roughness: 0.5 },
  glass: { color: "#12110D", metalness: 0.45, roughness: 0.12 },
  screen: { color: "#1B1A15", metalness: 0.2, roughness: 0.3 },
  pcb: { color: "#22201A", metalness: 0.25, roughness: 0.6 },
  chip: { color: "#0D0C0A", metalness: 0.5, roughness: 0.35 },
  battery: { color: "#4A463A", metalness: 0.3, roughness: 0.5 },
  copper: { color: "#B26E3A", metalness: 0.95, roughness: 0.28 },
  flex: { color: "#F24C00", metalness: 0.15, roughness: 0.55 },
  shield: { color: "#A9A395", metalness: 0.95, roughness: 0.25 },
  rubber: { color: "#211F19", metalness: 0.05, roughness: 0.9 },
  signal: {
    color: "#F24C00",
    metalness: 0.35,
    roughness: 0.4,
    emissive: "#F24C00",
    emissiveIntensity: 0.22,
  },
};

const SIGNAL = new THREE.Color("#F24C00");
const CARBON = new THREE.Color("#161511");
const BONE_EDGE = new THREE.Color("#EDE9DC");
// Bench tones non-suspects gray toward while a verdict is highlighted.
const DIM_LIGHT = new THREE.Color("#ECE7DA");
const DIM_DARK = new THREE.Color("#131210");

/** Mutable per-frame control state shared with the canvas without re-renders. */
interface BayControls {
  explode: number;
}

/** Active fault-trace emphasis — null unless the DIAGNOSE tab is open. */
interface DiagnosisState {
  /** partId → rank; non-empty only at a verdict. */
  implicated: Record<string, RankInfo>;
  /** Parts softly spotlighted during the current question. */
  focusIds: readonly string[];
}

interface RigState {
  hovered: string | null;
  selected: string | null;
  diagnosis: DiagnosisState | null;
}

// --- Geometry helpers -------------------------------------------------------

function ShapeGeometry({ shape }: { shape: Shape }) {
  switch (shape.kind) {
    case "cyl":
      return (
        <cylinderGeometry
          args={[shape.rTop, shape.rBot, shape.h, shape.seg ?? 32]}
        />
      );
    case "torus":
      return (
        <torusGeometry args={[shape.r, shape.tube, 14, 48, shape.arc]} />
      );
    case "capsule":
      return <capsuleGeometry args={[shape.r, shape.len, 6, 16]} />;
    case "box":
      // Plain box — rounded boxes are handled by <ShapeMesh> directly.
      return <boxGeometry args={shape.size} />;
  }
}

function matProps(key: MaterialKey, xray: boolean, dark: boolean) {
  const m = MATERIALS[key];
  // On the night bench a 14%-opacity dark part vanishes into the dark page,
  // so x-ray ghosts get a faint bone emissive lift and a touch more body.
  const ghost = xray && dark;
  return {
    color: m.color,
    metalness: xray ? 0.1 : m.metalness,
    roughness: xray ? 0.9 : m.roughness,
    emissive: ghost ? "#EDE9DC" : m.emissive ?? "#000000",
    emissiveIntensity: ghost ? 0.12 : m.emissiveIntensity ?? 0,
    transparent: xray,
    opacity: xray ? (dark ? 0.22 : 0.14) : 1,
    depthWrite: !xray,
  } as const;
}

/** One mesh for a Shape — RoundedBox when a radius is requested. */
function ShapeMesh({
  shape,
  material,
  xray,
  dark,
  position,
  rotation,
  spin,
  spinBoost,
}: {
  shape: Shape;
  material: MaterialKey;
  xray: boolean;
  dark: boolean;
  position?: Vec3;
  rotation?: Vec3;
  spin?: "x" | "y" | "z";
  spinBoost?: MutableRefObject<boolean>;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const reduced = useReducedMotion();

  useFrame((_, delta) => {
    if (!spin || reduced || !ref.current) return;
    const fast = spinBoost?.current ? 22 : 2.2;
    ref.current.rotation[spin] += delta * fast;
  });

  const props = matProps(material, xray, dark);

  if (shape.kind === "box" && shape.radius) {
    return (
      <RoundedBox
        ref={ref}
        args={shape.size}
        radius={Math.min(shape.radius, Math.min(...shape.size) / 2 - 0.001)}
        smoothness={3}
        position={position}
        rotation={rotation}
      >
        <meshStandardMaterial {...props} />
      </RoundedBox>
    );
  }
  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <ShapeGeometry shape={shape} />
      <meshStandardMaterial {...props} />
    </mesh>
  );
}

/** Grid-repeated deco (keycaps, chip banks, vents) sharing one geometry. */
function GridDeco({
  deco,
  xray,
  dark,
}: {
  deco: Deco;
  xray: boolean;
  dark: boolean;
}) {
  const { grid } = deco;
  if (!grid) return null;
  const cells: Vec3[] = [];
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      cells.push([
        deco.position[0] + c * grid.pitchX,
        deco.position[1],
        deco.position[2] + r * grid.pitchZ,
      ]);
    }
  }
  return (
    <>
      {cells.map((p, i) => (
        <ShapeMesh
          key={i}
          shape={deco.shape}
          material={deco.material}
          xray={xray}
          dark={dark}
          position={p}
          rotation={deco.rotation}
        />
      ))}
    </>
  );
}

// --- Part -------------------------------------------------------------------

function PartMesh({
  part,
  order,
  controls,
  rig,
  xray,
  dark,
  onHover,
  onSelect,
  partRefs,
}: {
  part: PartDef;
  order: number;
  controls: MutableRefObject<BayControls>;
  rig: RigState;
  xray: boolean;
  dark: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  partRefs: MutableRefObject<Map<string, THREE.Group>>;
}) {
  const edgeColor = dark ? BONE_EDGE : CARBON;
  const group = useRef<THREE.Group | null>(null);
  const mainMat = useRef<THREE.MeshStandardMaterial>(null);
  const hovered = rig.hovered === part.id;
  const selected = rig.selected === part.id;
  const active = hovered || selected;
  const spinBoost = useRef(false);
  spinBoost.current = active;
  const reduced = useReducedMotion();

  // Fault-trace emphasis tiers (active always wins).
  const rank = rig.diagnosis?.implicated[part.id] ?? null;
  const focused =
    !rank && (rig.diagnosis?.focusIds.includes(part.id) ?? false);
  const dimmed =
    !!rig.diagnosis &&
    Object.keys(rig.diagnosis.implicated).length > 0 &&
    !rank &&
    !active;

  // Cached base color + scratch for the dim damp — never re-read from the
  // (mutated) material.
  const baseColor = useMemo(
    () => new THREE.Color(MATERIALS[part.material].color),
    [part.material],
  );
  const dimScratch = useMemo(() => new THREE.Color(), []);

  // Parts fly in from a scattered field on mount (device switch remounts).
  // Under reduced motion they appear already settled at their exploded slot —
  // no fly-in — so the scene has nothing to animate on load.
  const initial = useMemo<Vec3>(() => {
    const k = controls.current.explode;
    if (reduced) {
      return [
        part.position[0] + part.explode[0] * k,
        part.position[1] + part.explode[1] * k,
        part.position[2] + part.explode[2] * k,
      ];
    }
    return [
      part.position[0] + part.explode[0] * 2.6,
      part.position[1] + part.explode[1] * 2.6,
      part.position[2] + part.explode[2] * 2.6 - 1.5,
    ];
  }, [part, reduced, controls]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const k = controls.current.explode;
    // A selected part pulls slightly forward of its exploded slot.
    const lift = selected ? 0.25 : 0;
    damp3(
      g.position,
      [
        part.position[0] + part.explode[0] * k,
        part.position[1] + part.explode[1] * k + lift * 0.4,
        part.position[2] + part.explode[2] * k + lift,
      ],
      0.34 + order * 0.028,
      delta,
    );
    const m = mainMat.current;
    if (m) {
      // Emphasis tiers. A ranked suspect keeps its glow when also
      // hovered/selected (take the max) so clicking the primary suspect to
      // inspect it never DOWNGRADES its emphasis.
      const rankEmissive = rank
        ? rank.likelihood === "primary"
          ? xray
            ? 1.1
            : 0.5
          : rank.likelihood === "likely"
            ? xray
              ? 0.6
              : 0.22
            : xray
              ? 0.35
              : 0.1
        : 0;
      let targetEmissive: number;
      if (active) targetEmissive = Math.max(xray ? 0.9 : 0.26, rankEmissive);
      else if (rank) targetEmissive = rankEmissive;
      else if (focused) targetEmissive = xray ? 0.4 : 0.14;
      else
        targetEmissive =
          xray && dark ? 0.12 : MATERIALS[part.material].emissiveIntensity ?? 0;
      damp(m, "emissiveIntensity", targetEmissive, 0.12, delta);
      if (xray)
        damp(
          m,
          "opacity",
          active ? 0.5 : dimmed ? 0.06 : dark ? 0.22 : 0.14,
          0.12,
          delta,
        );
      // Bystanders gray toward the bench tone while a verdict highlights.
      const targetColor = dimmed
        ? dimScratch.copy(baseColor).lerp(dark ? DIM_DARK : DIM_LIGHT, 0.45)
        : baseColor;
      dampC(m.color, targetColor, 0.2, delta);
    }
    const s = active || rank?.likelihood === "primary" ? 1.03 : 1;
    damp3(g.scale, [s, s, s], 0.14, delta);
  });

  const base = MATERIALS[part.material];
  const props = matProps(part.material, xray, dark);
  const idleEmissive = xray && dark ? "#EDE9DC" : base.emissive ?? "#000000";

  const emphasized = active || !!rank || focused;
  const edgesOn =
    xray ||
    active ||
    rank?.likelihood === "primary" ||
    rank?.likelihood === "likely";
  const edgeTint = active || rank ? SIGNAL : edgeColor;

  const shapeEl =
    part.shape.kind === "box" && part.shape.radius ? (
      <RoundedBox
        args={part.shape.size}
        radius={Math.min(
          part.shape.radius,
          Math.min(...part.shape.size) / 2 - 0.001,
        )}
        smoothness={3}
      >
        <meshStandardMaterial
          ref={mainMat}
          {...props}
          emissive={emphasized ? "#F24C00" : idleEmissive}
        />
        <Edges visible={edgesOn} scale={1.001} threshold={20} color={edgeTint} />
      </RoundedBox>
    ) : (
      <mesh>
        <ShapeGeometry shape={part.shape} />
        <meshStandardMaterial
          ref={mainMat}
          {...props}
          emissive={emphasized ? "#F24C00" : idleEmissive}
        />
        <Edges visible={edgesOn} scale={1.001} threshold={20} color={edgeTint} />
      </mesh>
    );

  return (
    <group
      ref={(g) => {
        group.current = g;
        if (g) partRefs.current.set(part.id, g);
        else partRefs.current.delete(part.id);
      }}
      position={initial}
      rotation={part.rotation}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(part.id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(null);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(part.id);
      }}
    >
      {shapeEl}
      {part.decos?.map((deco, i) =>
        deco.grid ? (
          <GridDeco key={i} deco={deco} xray={xray} dark={dark} />
        ) : (
          <ShapeMesh
            key={i}
            shape={deco.shape}
            material={deco.material}
            xray={xray}
            dark={dark}
            position={deco.position}
            rotation={deco.rotation}
            spin={deco.spin}
            spinBoost={spinBoost}
          />
        ),
      )}
      {active && (
        <Html
          position={[0, 0, 0]}
          center
          zIndexRange={[30, 10]}
          style={{ pointerEvents: "none" }}
        >
          <div className="pointer-events-none -translate-y-9 whitespace-nowrap border border-carbon-950 bg-bone-50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-carbon-950 shadow-hard">
            <span className="mr-2 text-signal-600">{part.index}</span>
            {part.name}
          </div>
        </Html>
      )}
      {rank && !active && (
        <Html
          position={[0, 0, 0]}
          center
          zIndexRange={[25, 10]}
          style={{ pointerEvents: "none" }}
        >
          <div className="pointer-events-none -translate-y-7 whitespace-nowrap border border-signal-500 bg-bone-50 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-carbon-950 shadow-hard-sm">
            <span className="mr-1.5 text-signal-600">
              {String(rank.ordinal).padStart(2, "0")}
            </span>
            {rank.likelihood}
          </div>
        </Html>
      )}
    </group>
  );
}

// --- Scene ------------------------------------------------------------------

function BayScene({
  device,
  controls,
  rig,
  xray,
  dark,
  onHover,
  onSelect,
  onInteract,
  partRefs,
  chain,
}: {
  device: DeviceDef;
  controls: MutableRefObject<BayControls>;
  rig: RigState;
  xray: boolean;
  dark: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onInteract?: () => void;
  partRefs: MutableRefObject<Map<string, THREE.Group>>;
  chain: readonly string[] | null;
}) {
  const reduced = useReducedMotion();
  const camPos = useMemo<Vec3>(() => {
    const [el, az] = [device.baseTilt[0], device.baseTilt[1]];
    const r = device.camZ;
    return [
      r * Math.sin(az) * Math.cos(el),
      r * Math.sin(el) + 0.4,
      r * Math.cos(az) * Math.cos(el),
    ];
  }, [device]);

  return (
    <>
      <PerspectiveCamera makeDefault key={device.id} position={camPos} fov={34} />
      <OrbitControls
        key={`${device.id}-controls`}
        makeDefault
        enableZoom={false}
        enablePan={false}
        autoRotate={!reduced && !rig.selected && !rig.diagnosis}
        autoRotateSpeed={0.55}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.62}
        dampingFactor={0.08}
        onChange={onInteract}
      />

      <ambientLight intensity={0.85} color="#FFF6E8" />
      <directionalLight position={[5, 7, 4]} intensity={1.5} color="#FFFFFF" />
      <directionalLight position={[-6, 3, -5]} intensity={0.5} color="#FFE0C4" />
      <pointLight position={[0, -4, 3]} intensity={0.25} color="#F24C00" />
      {/* Procedural studio — no external HDR (CSP: connect-src 'self'). */}
      <Environment resolution={64} frames={1}>
        <Lightformer
          intensity={1.6}
          position={[0, 4, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 10, 1]}
          color="#FFF4E2"
        />
        <Lightformer
          intensity={1.1}
          position={[-5, 1, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[8, 3, 1]}
          color="#FFFFFF"
        />
        <Lightformer
          intensity={0.9}
          position={[5, 0, -1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[8, 3, 1]}
          color="#FFD9B8"
        />
        <Lightformer
          intensity={0.5}
          position={[0, -3, -4]}
          scale={[10, 2, 1]}
          color="#F4F1E8"
        />
      </Environment>

      <group>
        {device.parts.map((part, i) => (
          <PartMesh
            key={part.id}
            part={part}
            order={i}
            controls={controls}
            rig={rig}
            xray={xray}
            dark={dark}
            onHover={onHover}
            onSelect={onSelect}
            partRefs={partRefs}
          />
        ))}
      </group>

      {/* Verdict link lines — AFTER the parts group so its useFrame reads
          post-damp positions (same-priority callbacks run in mount order). */}
      {chain && chain.length > 0 && (
        <DiagnosisLinks chain={chain} partRefs={partRefs} reduced={!!reduced} />
      )}

      <ContactShadows
        position={[0, -3.1, 0]}
        opacity={dark ? 0.55 : 0.32}
        scale={14}
        blur={2.6}
        far={4.4}
        color={dark ? "#000000" : "#161511"}
        frames={reduced ? 1 : Infinity}
      />
      <Grid
        position={[0, -3.12, 0]}
        args={[30, 30]}
        cellSize={0.6}
        cellThickness={0.6}
        cellColor={dark ? "#3F3B30" : "#B9B4A3"}
        sectionSize={3}
        sectionThickness={1}
        sectionColor="#F24C00"
        fadeDistance={16}
        fadeStrength={2.5}
        infiniteGrid
      />
    </>
  );
}

// --- DOM shell ---------------------------------------------------------------

export default function DeviceBay() {
  const [deviceId, setDeviceId] = useState<DeviceDef["id"]>("phone");
  const [explodePct, setExplodePct] = useState(62);
  const [xray, setXray] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [bomTab, setBomTab] = useState<"parts" | "diagnose">("parts");
  const controls = useRef<BayControls>({ explode: 0.62 });
  const wrapRef = useRef<HTMLDivElement>(null);
  // Live registry of part group refs — DiagnosisLinks reads positions from it
  // per frame. Never triggers renders; self-cleans on device remount.
  const partRefs = useRef(new Map<string, THREE.Group>());
  // Render immediately and let the observer PARK the loop when scrolled away —
  // failing safe (a delayed/absent observer must never leave the scene blank).
  const [inView, setInView] = useState(true);
  const dark = useDocTheme() === "dark";
  const reduced = useReducedMotion();
  // 1600ms wake window: 22 staggered part damps settle in ~1.3s — the default
  // 1200ms could park the loop with a sub-pixel residual.
  const demand = useDemandLoop(1600);
  const diag = useDiagnosis(deviceId, bomTab === "diagnose", demand.wake);

  const device = getDevice(deviceId);
  const selectedPart = device.parts.find((p) => p.id === selected) ?? null;

  // Pause the render loop entirely when the bay scrolls out of view.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        // Coming back into view: paint the current state (needed in demand mode).
        if (entry.isIntersecting) demand.wake();
      },
      { rootMargin: "160px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [demand]);

  // A part can be hovered (body cursor = "pointer") when the bay unmounts via a
  // keyboard/focus-driven nav — pointerout never fires. Since document.body
  // persists across App Router client navigation and `cursor` inherits, restore
  // it on unmount so a "pointer" cursor can't leak into the next page.
  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  // Repaint when the theme flips — parts re-ink (edges, dim tones, x-ray ghost
  // emissive) and in demand/reduced-motion mode nothing else drives a frame.
  useEffect(() => {
    demand.wake();
  }, [dark, demand]);

  const setExplode = (pct: number) => {
    setExplodePct(pct);
    controls.current.explode = pct / 100;
    demand.wake();
  };

  const switchDevice = (id: DeviceDef["id"]) => {
    setDeviceId(id);
    setSelected(null);
    setHovered(null);
    // The keyed BayScene remount unmounts the hovered part without firing
    // pointerout, so clear the global cursor here too. (useDiagnosis resets
    // itself on deviceId change — flows are per-device.)
    document.body.style.cursor = "auto";
    demand.wake();
  };

  const diagnosing = bomTab === "diagnose";
  const rig: RigState = {
    hovered,
    selected,
    diagnosis: diagnosing
      ? { implicated: diag.implicated, focusIds: diag.focusIds }
      : null,
  };
  const chain = diagnosing && diag.chain.length > 0 ? diag.chain : null;

  // In demand mode (reduced motion) these shell-side updates must kick the
  // render loop so the affected parts can damp to their new state and settle.
  const wakeHover = (id: string | null) => {
    setHovered(id);
    demand.wake();
  };
  const wakeSelect = (id: string) => {
    setSelected((s) => (s === id ? null : id));
    demand.wake();
  };
  const clearSelect = () => {
    setSelected(null);
    demand.wake();
  };
  const toggleXray = () => {
    setXray((v) => !v);
    demand.wake();
  };
  const switchTab = (tab: "parts" | "diagnose") => {
    setBomTab(tab);
    if (tab === "diagnose") {
      // Auto-explode so suspects and link lines are visible; the existing
      // per-part damp animates the transition.
      setSelected(null);
      if (explodePct < 55) setExplode(70);
    }
    demand.wake();
  };
  const partName = (id: string) =>
    device.parts.find((p) => p.id === id)?.name ?? id;

  return (
    <div ref={wrapRef} className="grid gap-0 lg:grid-cols-[1fr_310px]">
      {/* ------------------------------------------------ 3D viewport */}
      <div className="relative min-h-[420px] overflow-hidden border-b border-carbon-950 bg-bone-100 lg:min-h-[560px] lg:border-b-0 lg:border-r">
        <Canvas
          frameloop={!inView ? "never" : reduced ? "demand" : "always"}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true }}
          onCreated={({ gl }) => {
            gl.domElement.style.touchAction = "pan-y";
          }}
          onPointerMissed={clearSelect}
          aria-label={`Interactive exploded 3D view of a ${device.label.toLowerCase()}`}
          className="!absolute inset-0"
        >
          <DemandDriver bind={demand} />
          <BayScene
            key={device.id}
            device={device}
            controls={controls}
            rig={rig}
            xray={xray}
            dark={dark}
            onHover={wakeHover}
            onSelect={wakeSelect}
            onInteract={demand.wake}
            partRefs={partRefs}
            chain={chain}
          />
        </Canvas>

        {/* Viewport furniture */}
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-3 text-carbon-500">
          <span className="mnl-reg" aria-hidden="true" />
          <span className="mnl-dim">{device.designation}</span>
        </div>
        <div className="pointer-events-none absolute right-4 top-4 hidden text-carbon-500 sm:block">
          <span className="mnl-dim">
            {xray ? "VIEW · X-RAY" : "VIEW · ISO"} / DRAG TO ORBIT
          </span>
        </div>
        <div
          className="pointer-events-none absolute bottom-[4.5rem] left-4 text-carbon-500 lg:bottom-4"
          aria-hidden="true"
        >
          <span className="mnl-dim">
            PARTS {String(device.parts.length).padStart(2, "0")} · SCALE 1:1
          </span>
        </div>

        {/* Control deck */}
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 border-t border-carbon-950 bg-bone-50/90 px-3 py-2.5 backdrop-blur-sm lg:gap-3 lg:px-4">
          <label className="flex min-w-[10rem] flex-1 items-center gap-3">
            <span className="mnl-dim shrink-0 text-carbon-700">Teardown</span>
            <input
              type="range"
              min={0}
              max={100}
              value={explodePct}
              onChange={(e) => setExplode(Number(e.target.value))}
              className="mnl-range w-full"
              aria-label="Explode the device into parts"
            />
            <span className="mnl-dim mnl-num w-10 shrink-0 text-right text-signal-600">
              {explodePct}%
            </span>
          </label>
          <button
            type="button"
            className="mnl-chip"
            data-active={xray}
            onClick={toggleXray}
            aria-pressed={xray}
          >
            X-Ray
          </button>
          <button
            type="button"
            className="mnl-chip"
            onClick={() => {
              setExplode(0);
              clearSelect();
            }}
          >
            Assemble
          </button>
        </div>
      </div>

      {/* ------------------------------------------------ BOM inspector */}
      <div className="flex max-h-[560px] flex-col bg-bone-50">
        <div className="flex items-center justify-between gap-2 border-b border-carbon-950 px-4 py-3">
          <div className="flex gap-1.5" role="tablist" aria-label="Inspector mode">
            <button
              type="button"
              role="tab"
              id="bay-tab-parts"
              aria-selected={bomTab === "parts"}
              // Only the active tab's panel is in the DOM — point aria-controls
              // at it only when it's rendered.
              aria-controls={bomTab === "parts" ? "bay-panel-parts" : undefined}
              data-active={bomTab === "parts"}
              className="mnl-chip px-2.5 py-1"
              onClick={() => switchTab("parts")}
            >
              Parts
            </button>
            <button
              type="button"
              role="tab"
              id="bay-tab-diagnose"
              aria-selected={bomTab === "diagnose"}
              aria-controls={
                bomTab === "diagnose" ? "bay-panel-diagnose" : undefined
              }
              data-active={bomTab === "diagnose"}
              className="mnl-chip px-2.5 py-1"
              onClick={() => switchTab("diagnose")}
            >
              Diagnose
            </button>
          </div>
          <span className="mnl-dim mnl-num shrink-0 text-carbon-500">
            {bomTab === "parts"
              ? `${device.parts.length} PCS`
              : diag.phase === "asking"
                ? `STEP ${String(diag.step).padStart(2, "0")}`
                : "FAULT TRACE"}
          </span>
        </div>

        {bomTab === "parts" ? (
          <div
            role="tabpanel"
            id="bay-panel-parts"
            aria-labelledby="bay-tab-parts"
            className="flex min-h-0 flex-1 flex-col"
          >
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {device.parts.map((part) => {
                const isActive = hovered === part.id || selected === part.id;
                return (
                  <li key={part.id}>
                    <button
                      type="button"
                      className={`flex w-full items-baseline gap-3 border-b border-carbon-150 px-4 py-2 text-left transition-colors ${
                        isActive ? "bg-signal-100" : "hover:bg-bone-200"
                      }`}
                      onMouseEnter={() => wakeHover(part.id)}
                      onMouseLeave={() => wakeHover(null)}
                      onFocus={() => wakeHover(part.id)}
                      onBlur={() => wakeHover(null)}
                      onClick={() => wakeSelect(part.id)}
                    >
                      <span className="mnl-dim mnl-num shrink-0 text-signal-600">
                        {part.index}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-mono text-xs text-carbon-700">
                        {part.name}
                      </span>
                      <span
                        className={`mnl-dim shrink-0 ${
                          selected === part.id ? "text-signal-600" : "text-carbon-400"
                        }`}
                      >
                        {selected === part.id ? "●" : "○"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Fault card */}
            <div className="shrink-0 border-t border-carbon-950 p-4">
              {selectedPart ? (
                <div>
                  <p className="mnl-dim text-signal-600">{selectedPart.index}</p>
                  <h3 className="mnl-title mt-1 text-sm text-carbon-950">
                    {selectedPart.name}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-carbon-500">
                    {selectedPart.role}
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {selectedPart.faults.map((f) => (
                      <li
                        key={f}
                        className="flex items-baseline gap-2 text-xs text-carbon-700"
                      >
                        <span className="mnl-dim text-signal-600">▸</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/quote"
                    className="mnl-btn mnl-btn-sm mt-4 w-full"
                  >
                    Get this fixed →
                  </Link>
                </div>
              ) : (
                <p className="font-mono text-xs leading-relaxed text-carbon-500">
                  SELECT A COMPONENT — in the viewport or the table — to read
                  its common faults. Everything listed here is repaired at the
                  kiosk.
                </p>
              )}
            </div>
          </div>
        ) : (
          <DiagnosePanel
            diag={diag}
            partName={partName}
            selected={selected}
            onPickSuspect={wakeSelect}
            onHoverSuspect={wakeHover}
          />
        )}
      </div>

      {/* ------------------------------------------------ Device switcher */}
      <div className="col-span-full flex flex-wrap gap-2 border-t border-carbon-950 bg-bone-200 px-3 py-3 lg:px-4">
        {DEVICES.map((d, i) => (
          <button
            key={d.id}
            type="button"
            className="mnl-chip"
            data-active={d.id === deviceId}
            aria-pressed={d.id === deviceId}
            onClick={() => switchDevice(d.id)}
          >
            <span className="mnl-num text-signal-600">0{i + 1}</span>
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}
