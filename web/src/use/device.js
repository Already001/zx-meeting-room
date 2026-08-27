/**
 * 设备形态只看入口 / UA，不看视口宽度。
 * zx 入口恒为 PC，m 入口恒为移动端，main 按 UA。
 */
export const resolveDevice = ({
  mpaPlatform,
  buildTarget,
  uaIsMobile,
  forced
} = {}) => {
  if (forced === "pc" || forced === "mobile") return forced;
  const platform = mpaPlatform || buildTarget;
  if (platform === "m") return "mobile";
  if (platform === "zx") return "pc";
  return uaIsMobile ? "mobile" : "pc";
};
