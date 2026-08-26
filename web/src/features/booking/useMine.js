import { ref } from "vue";
import { listMyBookings, releaseBooking } from "@/server/module/booking";
import { confirmAsk, showToastError, showToastSuccess } from "@/utils";

const toastError = (error) => {
  const msg =
    error.msg ||
    (error.response && error.response.data && error.response.data.msg) ||
    error.message;
  showToastError(msg || "操作失败");
};

/**
 * 我的预定弹层
 */
export const useMine = () => {
  const open = ref(false);
  const items = ref([]);
  const loading = ref(false);

  let loadSeq = 0;

  const reload = async () => {
    const seq = ++loadSeq;
    loading.value = true;
    try {
      const data = await listMyBookings();
      if (seq !== loadSeq) return;
      items.value = Array.isArray(data) ? data : [];
    } catch (error) {
      if (seq !== loadSeq) return;
      items.value = [];
      toastError(error);
    } finally {
      if (seq === loadSeq) loading.value = false;
    }
  };

  const askRelease = async (booking) => {
    const range = `${booking.start} - ${booking.end}`;
    const ok = await confirmAsk(
      `${booking.roomName} ${range}，释放后其他人可预定该时段。`,
      { title: "释放会议室", confirmText: "确认释放" }
    );
    if (!ok) return false;
    try {
      await releaseBooking(booking.id);
      showToastSuccess("会议室已提前释放");
      await reload();
      return true;
    } catch (error) {
      toastError(error);
      return false;
    }
  };

  return {
    open,
    items,
    loading,
    reload,
    askRelease
  };
};
