import type { DeviceDef, PartDef } from "./types";

/** Compile-time part-id registry — diagnostics suspects reference these. */
export type DronePartId =
  | "top-shell"
  | "arm-fr"
  | "arm-fl"
  | "arm-rr"
  | "arm-rl"
  | "gps"
  | "antennas"
  | "compass"
  | "camera"
  | "gimbal"
  | "obstacle-front"
  | "rc-board"
  | "fc"
  | "imu"
  | "esc"
  | "battery"
  | "obstacle-rear"
  | "downward-vision"
  | "landing-gear"
  | "bottom-shell";

interface DronePart extends PartDef {
  id: DronePartId;
}
interface DroneDef extends DeviceDef {
  id: "drone";
  parts: DronePart[];
}

// ---------------------------------------------------------------------------
// UNIT E — ROTORCRAFT (drone)
//
// Radial layout. Front is -z (gimbal/camera end), rear is +z, top is +y,
// bottom is -y. Front parts explode -z, rear parts +z, top parts +y, the
// two shells fly straight off in y, and interior boards fan out laterally in
// x so the exploded stack stays legible.
// ---------------------------------------------------------------------------

/** Helper: one drone arm with motor + two-blade prop, exploding radially. */
function droneArm(
  idx: number,
  sx: 1 | -1,
  sz: 1 | -1,
  label: "FR" | "FL" | "RR" | "RL",
): DronePart {
  const angle = Math.atan2(sz, sx);
  return {
    id: `arm-${label.toLowerCase() as Lowercase<typeof label>}`,
    index: `D-0${idx}`,
    name: `Arm + motor · ${label}`,
    role: "Brushless motor on a folding arm",
    faults: ["Snapped arm after crash", "Grinding motor bearing", "ESC burnout"],
    material: "housingDark",
    shape: { kind: "capsule", r: 0.075, len: 1.5 },
    position: [sx * 0.95, 0.06, sz * 0.78],
    // Rotation maps the capsule's local +Y to the outward horizontal
    // direction (sx, 0, sz)/√2. The whole part group rotates, so decos are
    // authored in the arm's local frame: +Y = outward, -X = world up.
    rotation: [0, -angle, -Math.PI / 2],
    explode: [sx * 1.5, 0.35 + idx * 0.12, sz * 1.3],
    decos: [
      {
        shape: { kind: "cyl", rTop: 0.16, rBot: 0.19, h: 0.22, seg: 24 },
        material: "shield",
        position: [-0.14, 0.68, 0],
        rotation: [0, 0, Math.PI / 2],
      },
      {
        shape: { kind: "cyl", rTop: 0.05, rBot: 0.05, h: 0.1, seg: 12 },
        material: "signal",
        position: [-0.3, 0.68, 0],
        rotation: [0, 0, Math.PI / 2],
      },
      {
        shape: { kind: "box", size: [0.022, 1.35, 0.11], radius: 0.01 },
        material: "rubber",
        position: [-0.38, 0.68, 0],
        spin: "x",
      },
    ],
  };
}

export const DRONE: DroneDef = {
  id: "drone",
  label: "Drone",
  designation: "UNIT E · ROTORCRAFT",
  camZ: 8.6,
  baseTilt: [0.42, -0.5, 0],
  parts: [
    {
      id: "top-shell",
      index: "D-01",
      name: "Top shell",
      role: "Aerodynamic cover + GPS window",
      faults: ["Crash cracks", "Stress-fractured mounts"],
      material: "housing",
      shape: { kind: "box", size: [1.7, 0.22, 2.1], radius: 0.18 },
      position: [0, 0.22, 0],
      explode: [0, 1.7, 0],
    },
    droneArm(2, 1, -1, "FR"),
    droneArm(3, -1, -1, "FL"),
    droneArm(4, 1, 1, "RR"),
    droneArm(5, -1, 1, "RL"),
    {
      id: "gps",
      index: "D-06",
      name: "GPS module",
      role: "Ceramic patch antenna under the shell",
      faults: ["Weak satellite lock", "Drifting hover"],
      material: "signal",
      shape: { kind: "box", size: [0.42, 0.1, 0.42], radius: 0.04 },
      position: [0, 0.34, 0.55],
      explode: [0.55, 1.25, 1.0],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.1, rBot: 0.1, h: 0.04, seg: 16 },
          material: "copper",
          position: [0, 0.07, 0],
        },
      ],
    },
    {
      id: "antennas",
      index: "D-07",
      name: "Antenna array",
      role: "Video + control radio antennas near the shell",
      faults: ["Short control range", "Video signal dropouts"],
      material: "copper",
      shape: { kind: "box", size: [0.9, 0.07, 0.16], radius: 0.02 },
      position: [0, -0.16, 0.8],
      explode: [1.0, -0.7, 1.9],
      decos: [
        {
          shape: { kind: "box", size: [0.34, 0.03, 0.1], radius: 0.01 },
          material: "signal",
          position: [0.25, 0.05, 0],
        },
        {
          shape: { kind: "box", size: [0.34, 0.03, 0.1], radius: 0.01 },
          material: "signal",
          position: [-0.25, 0.05, 0],
        },
        {
          shape: { kind: "box", size: [0.1, 0.06, 0.1] },
          material: "flex",
          position: [0, -0.05, 0.05],
        },
      ],
    },
    {
      id: "compass",
      index: "D-08",
      name: "Compass module",
      role: "Magnetometer for heading hold",
      faults: ["Compass interference errors", "Won't calibrate"],
      material: "pcb",
      shape: { kind: "box", size: [0.22, 0.09, 0.22], radius: 0.02 },
      position: [0.5, 0.3, 0.5],
      explode: [0.9, 1.2, 0.3],
      decos: [
        {
          shape: { kind: "box", size: [0.1, 0.05, 0.1] },
          material: "chip",
          position: [0, 0.06, 0],
        },
        {
          shape: { kind: "cyl", rTop: 0.05, rBot: 0.05, h: 0.03, seg: 12 },
          material: "signal",
          position: [0, 0.08, 0.06],
        },
      ],
    },
    {
      id: "camera",
      index: "D-09",
      name: "Camera module",
      role: "Image sensor + lens block in the gimbal",
      faults: ["Blurry / soft footage", "Cracked lens glass", "Snapped camera ribbon"],
      material: "housingDark",
      shape: { kind: "box", size: [0.3, 0.28, 0.26], radius: 0.06 },
      position: [0, -0.12, -1.2],
      explode: [0, -1.43, -2.7],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.1, rBot: 0.1, h: 0.1, seg: 20 },
          material: "glass",
          position: [0, 0, -0.16],
          rotation: [Math.PI / 2, 0, 0],
        },
        {
          shape: { kind: "box", size: [0.2, 0.18, 0.05] },
          material: "pcb",
          position: [0, 0, 0.14],
        },
        {
          shape: { kind: "cyl", rTop: 0.045, rBot: 0.045, h: 0.04, seg: 12 },
          material: "signal",
          position: [0.09, -0.09, -0.15],
          rotation: [Math.PI / 2, 0, 0],
        },
      ],
    },
    {
      id: "gimbal",
      index: "D-10",
      name: "Gimbal cage (3-axis)",
      role: "Motorised yaw-roll-pitch stabiliser cage",
      faults: ["Gimbal motor overload", "Bent yaw arm after crash", "Stuck axis / horizon tilt"],
      material: "housingDark",
      shape: { kind: "box", size: [0.42, 0.42, 0.42], radius: 0.1 },
      position: [0, -0.12, -1.05],
      explode: [0, -0.95, -1.9],
      decos: [
        {
          shape: { kind: "capsule", r: 0.035, len: 0.3 },
          material: "shield",
          position: [0.24, 0.18, 0.05],
          rotation: [0, 0, Math.PI / 2],
        },
        {
          shape: { kind: "cyl", rTop: 0.08, rBot: 0.08, h: 0.1, seg: 16 },
          material: "shield",
          position: [0, 0.22, 0],
        },
        {
          shape: { kind: "box", size: [0.1, 0.16, 0.02] },
          material: "flex",
          position: [0, 0, 0.2],
        },
      ],
    },
    {
      id: "obstacle-front",
      index: "D-11",
      name: "Front vision sensors",
      role: "Forward stereo vision cameras",
      faults: ["Obstacle-sensor errors", "Fogged / scratched sensor glass"],
      material: "housingDark",
      shape: { kind: "box", size: [0.5, 0.16, 0.12], radius: 0.03 },
      position: [0, 0.13, -1.16],
      explode: [0, 0.95, -2.5],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.05, rBot: 0.05, h: 0.06, seg: 16 },
          material: "glass",
          position: [-0.16, 0, -0.07],
          rotation: [Math.PI / 2, 0, 0],
        },
        {
          shape: { kind: "cyl", rTop: 0.05, rBot: 0.05, h: 0.06, seg: 16 },
          material: "glass",
          position: [0.16, 0, -0.07],
          rotation: [Math.PI / 2, 0, 0],
        },
        {
          shape: { kind: "cyl", rTop: 0.03, rBot: 0.03, h: 0.05, seg: 12 },
          material: "signal",
          position: [0, 0, -0.07],
          rotation: [Math.PI / 2, 0, 0],
        },
      ],
    },
    {
      id: "rc-board",
      index: "D-12",
      name: "Video-transmission board",
      role: "Live downlink + radio-control board",
      faults: ["Video transmission dropouts", "No live feed to controller"],
      material: "pcb",
      shape: { kind: "box", size: [0.6, 0.07, 0.55], radius: 0.03 },
      position: [0, 0.03, 0.35],
      explode: [-1.5, -0.25, 1.15],
      decos: [
        {
          shape: { kind: "box", size: [0.18, 0.06, 0.18] },
          material: "shield",
          position: [0, 0.05, -0.12],
        },
        {
          shape: { kind: "box", size: [0.1, 0.05, 0.1] },
          material: "chip",
          position: [-0.15, 0.045, 0.15],
          grid: { rows: 1, cols: 2, pitchX: 0.3, pitchZ: 0 },
        },
        {
          shape: { kind: "box", size: [0.14, 0.03, 0.1] },
          material: "flex",
          position: [0.22, 0.02, 0.2],
        },
      ],
    },
    {
      id: "fc",
      index: "D-13",
      name: "Flight controller",
      role: "Barometer, sensor fusion and the brains of the hover",
      faults: ["No-fly lockouts", "Boot / arming faults", "Sensor-fusion errors"],
      material: "pcb",
      shape: { kind: "box", size: [0.75, 0.07, 0.95], radius: 0.03 },
      position: [0, 0.12, -0.35],
      explode: [-1.3, 0.85, -0.75],
      decos: [
        {
          shape: { kind: "box", size: [0.22, 0.06, 0.22] },
          material: "chip",
          position: [0, 0.05, -0.15],
        },
        {
          shape: { kind: "box", size: [0.1, 0.05, 0.1] },
          material: "chip",
          position: [-0.2, 0.045, 0.22],
          grid: { rows: 1, cols: 3, pitchX: 0.2, pitchZ: 0 },
        },
      ],
    },
    {
      id: "imu",
      index: "D-14",
      name: "IMU (on dampers)",
      role: "Inertial measurement unit on damping mounts",
      faults: ["IMU calibration errors", "Drifting / tilting hover"],
      material: "pcb",
      shape: { kind: "box", size: [0.22, 0.1, 0.22], radius: 0.02 },
      position: [0.3, 0.08, -0.55],
      explode: [0.95, 1.35, -1.35],
      decos: [
        {
          shape: { kind: "box", size: [0.1, 0.05, 0.1] },
          material: "chip",
          position: [0, 0.06, 0],
        },
        {
          shape: { kind: "cyl", rTop: 0.03, rBot: 0.03, h: 0.05, seg: 10 },
          material: "rubber",
          position: [-0.08, -0.06, -0.08],
          grid: { rows: 2, cols: 2, pitchX: 0.16, pitchZ: 0.16 },
        },
      ],
    },
    {
      id: "esc",
      index: "D-15",
      name: "ESC power board",
      role: "Speed controllers feeding all four motors",
      faults: ["Burnt MOSFETs", "One motor won't spin"],
      material: "pcb",
      shape: { kind: "box", size: [0.75, 0.07, 0.7], radius: 0.03 },
      position: [0, -0.05, 0.05],
      explode: [1.35, -0.45, 0.3],
      decos: [
        {
          shape: { kind: "box", size: [0.13, 0.06, 0.13] },
          material: "chip",
          position: [-0.22, -0.05, -0.18],
          grid: { rows: 2, cols: 3, pitchX: 0.22, pitchZ: 0.36 },
        },
      ],
    },
    {
      id: "battery",
      index: "D-16",
      name: "Flight battery",
      role: "Smart LiPo — slides into the spine",
      faults: ["Puffed cells", "Won't hold charge", "Charge-port faults"],
      material: "battery",
      shape: { kind: "box", size: [0.95, 0.5, 1.35], radius: 0.09 },
      position: [0, 0.05, 0.25],
      explode: [0, 0.55, 2.2],
      decos: [
        {
          shape: { kind: "box", size: [0.8, 0.16, 0.02], radius: 0.02 },
          material: "signal",
          position: [0, 0.1, 0.68],
        },
        {
          shape: { kind: "cyl", rTop: 0.05, rBot: 0.05, h: 0.03, seg: 12 },
          material: "signal",
          position: [-0.28, 0.26, 0.4],
        },
      ],
    },
    {
      id: "obstacle-rear",
      index: "D-17",
      name: "Rear vision sensors",
      role: "Rear stereo vision cameras",
      faults: ["Rear vision-sensor errors", "Cracked sensor cover"],
      material: "housingDark",
      shape: { kind: "box", size: [0.5, 0.16, 0.12], radius: 0.03 },
      position: [0, -0.03, 1.06],
      explode: [0, -0.8, 2.7],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.05, rBot: 0.05, h: 0.06, seg: 16 },
          material: "glass",
          position: [-0.16, 0, 0.07],
          rotation: [Math.PI / 2, 0, 0],
        },
        {
          shape: { kind: "cyl", rTop: 0.05, rBot: 0.05, h: 0.06, seg: 16 },
          material: "glass",
          position: [0.16, 0, 0.07],
          rotation: [Math.PI / 2, 0, 0],
        },
      ],
    },
    {
      id: "downward-vision",
      index: "D-18",
      name: "Downward vision + ToF",
      role: "Downward cameras + ToF for low-altitude hover",
      faults: ["Unstable low hover", "Downward-sensor / ToF errors"],
      material: "housingDark",
      shape: { kind: "box", size: [0.5, 0.1, 0.34], radius: 0.03 },
      position: [0, -0.26, -0.15],
      explode: [0, -1.2, -0.95],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.05, rBot: 0.05, h: 0.05, seg: 16 },
          material: "glass",
          position: [-0.15, -0.06, 0],
        },
        {
          shape: { kind: "cyl", rTop: 0.05, rBot: 0.05, h: 0.05, seg: 16 },
          material: "glass",
          position: [0.15, -0.06, 0],
        },
        {
          shape: { kind: "cyl", rTop: 0.04, rBot: 0.04, h: 0.04, seg: 12 },
          material: "signal",
          position: [0, -0.06, -0.12],
        },
      ],
    },
    {
      id: "landing-gear",
      index: "D-19",
      name: "Landing gear",
      role: "Folding legs that take the landing loads",
      faults: ["Cracked landing legs after crash", "Bent / splayed feet"],
      material: "housingDark",
      shape: { kind: "box", size: [1.3, 0.12, 0.5], radius: 0.04 },
      position: [0, -0.32, 0.15],
      explode: [0, -1.35, 1.25],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.06, rBot: 0.08, h: 0.14, seg: 12 },
          material: "rubber",
          position: [-0.5, -0.12, -0.18],
          grid: { rows: 2, cols: 2, pitchX: 1.0, pitchZ: 0.36 },
        },
      ],
    },
    {
      id: "bottom-shell",
      index: "D-20",
      name: "Bottom shell",
      role: "Landing frame that closes out the belly",
      faults: ["Cracked belly panel", "Stress-fractured mounts"],
      material: "housing",
      shape: { kind: "box", size: [1.7, 0.2, 2.1], radius: 0.18 },
      position: [0, -0.18, 0],
      explode: [0, -1.75, 0],
      decos: [
        {
          shape: { kind: "cyl", rTop: 0.07, rBot: 0.07, h: 0.03, seg: 14 },
          material: "glass",
          position: [-0.3, -0.11, -0.6],
          grid: { rows: 1, cols: 2, pitchX: 0.6, pitchZ: 0 },
        },
      ],
    },
  ],
};
