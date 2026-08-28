import { CAPACITY_OPTIONS } from "./constants.js";

export const roomPlace = (room) => `${room.buildingName} ${room.floorName}`;

export const roomMatchesFilters = (room, filters, keyword = "") => {
  if (filters.place !== "all" && roomPlace(room) !== filters.place) {
    return false;
  }
  if (filters.capacity !== "all") {
    const option = CAPACITY_OPTIONS.find((c) => c.id === filters.capacity);
    if (option && option.min !== undefined) {
      if (room.capacity < option.min || room.capacity > option.max)
        return false;
    }
  }
  if (
    filters.facilities.length > 0 &&
    !filters.facilities.every((f) => (room.facilities || []).includes(f))
  ) {
    return false;
  }
  const q = String(keyword || "")
    .trim()
    .toLowerCase();
  if (q) {
    const hay =
      `${room.name} ${room.buildingName} ${room.floorName}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
};
