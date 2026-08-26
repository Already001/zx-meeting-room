export const FLOOR_OPTIONS = Array.from({ length: 20 }, (_, i) => `${i + 1}层`);
export const BOOK_AHEAD_OPTIONS = [
  { value: 7, label: "7 天" },
  { value: 30, label: "30 天" },
  { value: 90, label: "90 天（3个月内）" },
  { value: 180, label: "180 天（半年内）" }
];
