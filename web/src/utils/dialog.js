import { unref } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import { showSuccessToast, showFailToast, showDialog } from "vant";
import { fullscreenElement } from "@/use/useElementState";
import useMobileEnv from "@/use/useMobileEnv";

// Toast / Dialog 的 CSS 在三处 main.js 里、于 style.css 之前引入，
// 保证智信 :root 令牌能覆盖 Element Plus / Vant 的默认色板与字体。

const { mobileEnv } = useMobileEnv();

/** 成功提示 */
export const showToastSuccess = (message, duration) => {
  if (mobileEnv.value) {
    showSuccessToast({
      message,
      forbidClick: true,
      duration: duration ? duration : 3000
    });
  } else {
    ElMessage.success({
      message,
      duration: duration ? duration : 3000,
      appendTo: unref(fullscreenElement) || "body"
    });
  }
};

/** 错误提示 */
export const showToastError = (message, showWarning = false) => {
  if (mobileEnv.value) {
    showFailToast({ message, forbidClick: true });
  } else {
    ElMessage({
      type: showWarning ? "warning" : "error",
      message,
      duration: 3000,
      appendTo: unref(fullscreenElement) || "body"
    });
  }
};

/** 单按钮告知型弹框（版本自更新提示用） */
export const confirmNoted = (message, { title, confirmText, ...args } = {}) => {
  if (mobileEnv.value) {
    return showDialog({
      title: title || "提示",
      message,
      width: "80%",
      confirmButtonColor: "#3E7EFF",
      confirmButtonText: confirmText || "确定",
      overlayStyle: { background: "rgba(0, 0, 0, 0.45)" }
    });
  }
  return ElMessageBox.confirm(message, title || "提示", {
    confirmButtonText: confirmText || "确定",
    showCancelButton: false,
    type: "warning",
    autofocus: false,
    closeOnClickModal: false,
    closeOnPressEscape: false,
    appendTo: unref(fullscreenElement) || "body",
    ...args
  });
};
