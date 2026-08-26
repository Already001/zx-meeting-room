/**
 * 设施列：按设施字典（含停用）sort 顺序拼接，房间上有但字典没有的项跟在后面。
 * 空数组或空值显示为 —
 */
export const formatFacilities = (list, dicts) => {
  const items = list || [];
  if (!items.length) return "—";
  const order = (dicts || [])
    .filter((d) => d.type === "facility")
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "zh-CN"))
    .map((d) => d.name);
  const named = order.filter((name) => items.includes(name));
  const extra = items.filter((name) => !order.includes(name));
  return [...named, ...extra].join(" / ");
};
