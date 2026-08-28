const GAP = 8;
const MARGIN = 8;

/**
 * 确认卡贴在选区会议室行下方；太靠下边放不下时翻到行上方。
 * 水平以选区中心对齐，贴边时夹进视口。
 */
export const placeConfirmCard = ({
  row,
  viewport,
  card,
  gap = GAP,
  margin = MARGIN
}) => {
  const centerX = row.left + row.width / 2;
  const left = Math.round(
    Math.min(
      Math.max(centerX - card.width / 2, margin),
      Math.max(margin, viewport.width - card.width - margin)
    )
  );
  const viewBottom = viewport.bottom ?? viewport.height;
  const belowTop = row.bottom + gap;
  const fitsBelow = belowTop + card.height + margin <= viewBottom;
  const top = Math.round(fitsBelow ? belowTop : row.top - gap - card.height);
  return { left, top, placement: fitsBelow ? "below" : "above" };
};
