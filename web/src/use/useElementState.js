import { ref } from "vue";

// 全屏元素引用：Element Plus 的弹层需要 appendTo 到它，否则全屏下弹层不可见
const fullscreenElement = ref(null);

document.addEventListener("fullscreenchange", function () {
  fullscreenElement.value = document.fullscreenElement;
});

export { fullscreenElement };
