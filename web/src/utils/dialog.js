import { unref } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import { showSuccessToast, showFailToast, showDialog } from "vant";
import { fullscreenElement } from "@/use/useElementState";
import useMobileEnv from "@/use/useMobileEnv";

// 本文件是显式 import（非模板里的 AutoImport/Components 按需注册），
// 三处 main.js 已去掉整包 CSS，这里必须自己补上用到的组件样式，否则弹窗会裸奔。
import "element-plus/theme-chalk/el-message.css";
import "element-plus/theme-chalk/el-message-box.css";
import "element-plus/theme-chalk/el-overlay.css";
import "vant/es/toast/style";
import "vant/es/dialog/style";

const { mobileEnv } = useMobileEnv();

/** 成功提示 */
export const showToastSuccess = (message, duration) => {
  if (mobileEnv.value) {
    showSuccessToast({
      message,
      forbidClick: true,
      duration: duration ? duration : 2000
    });
  } else {
    ElMessage.success({
      message,
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
      overlayStyle: { background: "rgba(0, 0, 0, 0.5) !important" }
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
