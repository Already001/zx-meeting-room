export const MINE_STATUS_LABEL = {
  ongoing: "进行中",
  upcoming: "待开始",
  ended: "已结束",
  released: "已释放"
};

export const canChangeBooking = (status) =>
  status === "ongoing" || status === "upcoming";

export const createdCount = (result) => {
  if (result && Array.isArray(result.items) && result.items.length) {
    return result.items.length;
  }
  return 1;
};
