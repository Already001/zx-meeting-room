const POSE_KEYS = [
  "leftY",
  "leftH",
  "leftRx",
  "rightY",
  "rightH",
  "rightRx",
  "shiftY"
];

const IDLE_POSE = {
  leftY: 22,
  leftH: 16,
  leftRx: 4.5,
  rightY: 22,
  rightH: 16,
  rightRx: 4.5,
  shiftY: 0
};

const POSES = {
  idle: IDLE_POSE,
  focus: {
    leftY: 21,
    leftH: 18,
    leftRx: 4.5,
    rightY: 21,
    rightH: 18,
    rightRx: 4.5,
    shiftY: 0
  },
  ease: {
    leftY: 26,
    leftH: 11,
    leftRx: 5.5,
    rightY: 26,
    rightH: 11,
    rightRx: 5.5,
    shiftY: 0
  },
  expect: {
    leftY: 20,
    leftH: 16,
    leftRx: 4.5,
    rightY: 20,
    rightH: 16,
    rightRx: 4.5,
    shiftY: -3.5
  },
  sorry: {
    leftY: 24,
    leftH: 14,
    leftRx: 8,
    rightY: 24,
    rightH: 14,
    rightRx: 8,
    shiftY: 1
  },
  puzzled: {
    leftY: 26,
    leftH: 9,
    leftRx: 4,
    rightY: 22,
    rightH: 16,
    rightRx: 4.5,
    shiftY: 0
  },
  happy: {
    leftY: 29,
    leftH: 5,
    leftRx: 2.5,
    rightY: 29,
    rightH: 5,
    rightRx: 2.5,
    shiftY: -1
  },
  down: {
    leftY: 24,
    leftH: 12,
    leftRx: 6,
    rightY: 24,
    rightH: 12,
    rightRx: 6,
    shiftY: 5
  }
};

export function poseFor(expression) {
  return { ...(POSES[expression] || IDLE_POSE) };
}

export function lerpPose(from, to, t) {
  const u = t < 0 ? 0 : t > 1 ? 1 : t;
  /** @type {typeof IDLE_POSE} */
  const out = { ...IDLE_POSE };
  for (const key of POSE_KEYS) {
    out[key] = from[key] + (to[key] - from[key]) * u;
  }
  return out;
}

export function easeInOutCubic(t) {
  const u = t < 0 ? 0 : t > 1 ? 1 : t;
  return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
}

/** 换表情时先闭眼再睁开，避免眼形硬切。 */
export function morphSquash(t) {
  const u = t < 0 ? 0 : t > 1 ? 1 : t;
  if (u < 0.28) return 1 - (u / 0.28) * 0.9;
  if (u < 0.4) return 0.1;
  return 0.1 + ((u - 0.4) / 0.6) * 0.9;
}
