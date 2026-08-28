/**
 * 快捷建议只在黑球收起时浮在球上方；展开对话框后只留输入区。
 * @param {{ dockOpen: boolean, suggestions: unknown[] }} state
 */
export function shouldShowBuddyPrompts({ dockOpen, suggestions }) {
  return Boolean(!dockOpen && suggestions?.length);
}
