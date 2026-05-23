import { currentMonitor } from "@tauri-apps/api/window";
import type { getCurrentWindow } from "@tauri-apps/api/window";

type WindowHandle = ReturnType<typeof getCurrentWindow>;

export async function snapWindowToScreen(appWindow: WindowHandle) {
  const monitor = await currentMonitor();
  if (!monitor) return;

  // Monitor's work area (excluding taskbar etc.)
  const { position: monPos, size: monSize } = monitor.workArea;

  // window's outer position (top-left corner) & outer size
  const winPos = await appWindow.outerPosition();
  const winSize = await appWindow.outerSize();

  // Window corners (in physical pixels)
  const left = winPos.x;
  const top = winPos.y;
  const right = winPos.x + winSize.width;
  const bottom = winPos.y + winSize.height;

  // Monitor bounds
  const monLeft = monPos.x;
  const monTop = monPos.y;
  const monRight = monPos.x + monSize.width;
  const monBottom = monPos.y + monSize.height;

  let newX = winPos.x;
  let newY = winPos.y;
  let snapped = false;

  // If window is wider than the monitor work area, just align left
  if (winSize.width > monSize.width) {
    if (left !== monLeft) { newX = monLeft; snapped = true; }
  } else {
    if (left < monLeft) { newX = monLeft; snapped = true; }
    else if (right > monRight) { newX = monRight - winSize.width; snapped = true; }
  }

  if (winSize.height > monSize.height) {
    if (top !== monTop) { newY = monTop; snapped = true; }
  } else {
    if (top < monTop) { newY = monTop; snapped = true; }
    else if (bottom > monBottom) { newY = monBottom - winSize.height; snapped = true; }
  }

  if (snapped) {
    const { PhysicalPosition } = await import("@tauri-apps/api/dpi");
    await appWindow.setPosition(new PhysicalPosition(newX, newY));
  }
}

/**
 * Set up touch-drag on the titlebar (for touchscreen compatibility)
 * and native-window-drag snap detection.
 */
export function initWindowManagement(
  titlebar: HTMLElement,
  appWindow: WindowHandle,
) {
  const touchDragRef = { active: false };

  // --- Touch drag ---
  let touchStartX = 0;
  let touchStartY = 0;
  let winStartX = 0;
  let winStartY = 0;
  let isDragging = false;

  titlebar.addEventListener("touchstart", async (e) => {
    const touch = e.touches[0];
    if (!touch) return;
    e.preventDefault();          // prevent Tauri from also starting a native drag
    isDragging = true;
    touchDragRef.active = true;  // flag: touch drag in progress
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    const pos = await appWindow.outerPosition();
    winStartX = pos.x;
    winStartY = pos.y;
  }, { passive: false });

  titlebar.addEventListener("touchmove", async (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    if (!touch) return;

    const { PhysicalPosition } = await import("@tauri-apps/api/dpi");
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    await appWindow.setPosition(new PhysicalPosition(winStartX + dx, winStartY + dy));
  }, { passive: true });

  titlebar.addEventListener("touchend", () => {
    if (!isDragging) return;
    isDragging = false;
    snapWindowToScreen(appWindow);
    // Keep the flag briefly so onMoved doesn't double-snap
    setTimeout(() => { touchDragRef.active = false; }, 200);
  }, { passive: true });

  // --- Native drag snap (data-tauri-drag-region) ---
  let dragEndTimer: ReturnType<typeof setTimeout> | undefined;
  appWindow.onMoved(() => {
    // Ignore moves caused by touch drag — touchend handles snapping itself
    if (touchDragRef.active) return;
    clearTimeout(dragEndTimer);
    dragEndTimer = setTimeout(() => snapWindowToScreen(appWindow), 150);
  });
}
