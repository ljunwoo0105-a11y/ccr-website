"use client";

// ---------------------------------------------------------------------------
// Verdict link lines — one dashed "annotation ink" line drawn through the
// suspect chain (primary first), plus a solder-point marker on each suspect.
// Mounted ONLY while a verdict exists, so idle cost is zero. Must render
// AFTER the parts <group> in BayScene: same-priority useFrame callbacks run
// in mount order, so this reads post-damp part positions with no lag.
// depthTest=false + high renderOrder makes it read as drafting overlay ink —
// straight segments never z-fight with the part meshes.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import type { Line2 } from "three-stdlib";

// Shared singletons — never disposed (module lifetime, a few bytes).
const NODE_GEO = new THREE.SphereGeometry(0.05, 12, 12);
const NODE_MAT = new THREE.MeshBasicMaterial({
  color: "#F24C00",
  toneMapped: false,
  depthTest: false,
  transparent: true,
  opacity: 0.95,
});

export default function DiagnosisLinks({
  chain,
  partRefs,
  reduced,
}: {
  /** Ordered partIds, primary suspect first. */
  chain: readonly string[];
  partRefs: MutableRefObject<Map<string, THREE.Group>>;
  reduced: boolean;
}) {
  const line = useRef<Line2>(null);
  const markers = useRef<(THREE.Mesh | null)[]>([]);

  // Chain length is fixed for the life of a verdict — preallocate once.
  const flat = useMemo(() => new Float32Array(chain.length * 3), [chain]);
  const initial = useMemo(
    () =>
      chain.map((id) => {
        const g = partRefs.current.get(id);
        return (g ? [g.position.x, g.position.y, g.position.z] : [0, 0, 0]) as [
          number,
          number,
          number,
        ];
      }),
    [chain, partRefs],
  );

  useFrame((_, delta) => {
    let complete = true;
    for (let i = 0; i < chain.length; i++) {
      const g = partRefs.current.get(chain[i]);
      if (!g) {
        complete = false;
        continue;
      }
      flat[i * 3] = g.position.x;
      flat[i * 3 + 1] = g.position.y;
      flat[i * 3 + 2] = g.position.z;
      markers.current[i]?.position.copy(g.position);
    }
    const l = line.current;
    if (l && complete) {
      l.geometry.setPositions(flat);
      l.computeLineDistances();
      if (!reduced) {
        // Dashes march FROM the primary suspect down the chain — a direction
        // cue with zero extra meshes. Static under reduced motion.
        (l.material as THREE.Material & { dashOffset: number }).dashOffset -=
          delta * 0.6;
      }
    }
  });

  // drei's Line2 disposal has been leaky across versions — belt and braces.
  useEffect(() => {
    const l = line.current;
    return () => {
      l?.geometry.dispose();
      (l?.material as THREE.Material | undefined)?.dispose();
    };
  }, []);

  return (
    <group>
      {chain.length >= 2 && (
        <Line
          ref={line}
          points={initial}
          color="#F24C00"
          lineWidth={2}
          dashed
          dashSize={0.16}
          gapSize={0.1}
          transparent
          opacity={0.9}
          depthTest={false}
          renderOrder={50}
          toneMapped={false}
        />
      )}
      {chain.map((id, i) => (
        <mesh
          key={`${id}-${i}`}
          ref={(m) => {
            markers.current[i] = m;
          }}
          geometry={NODE_GEO}
          material={NODE_MAT}
          position={initial[i]}
          renderOrder={51}
        />
      ))}
    </group>
  );
}
