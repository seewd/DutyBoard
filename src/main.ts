import dayjs from "dayjs";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { initWindowManagement } from "./window-utils";
import { getTodayDutyInfo, getNextDutyInfo } from "./duty-data";

let dateEl: HTMLElement | null;
let dutyLabelEl: HTMLElement | null;
let dutyNamesEl: HTMLElement | null;
let dutyNextEl: HTMLElement | null;

/** 上课时段（窗口隐藏）
 * [start, end) 左闭右开 */
const HIDDEN_PERIODS = [
  { start: [8, 0], end: [8, 40] },
  { start: [8, 50], end: [9, 30] },
  { start: [9, 50], end: [10, 30] },
  { start: [10, 40], end: [11, 20] },
  { start: [11, 30], end: [12, 10] },
  { start: [13, 40], end: [14, 20] },
  { start: [14, 30], end: [15, 10] },
  { start: [15, 30], end: [16, 10] },
  { start: [16, 20], end: [17, 0] },
] as const;

function isInHiddenPeriod(now: dayjs.Dayjs): boolean {
  const m = now.hour() * 60 + now.minute();
  return HIDDEN_PERIODS.some(p =>
    m >= p.start[0] * 60 + p.start[1] &&
    m < p.end[0] * 60 + p.end[1],
  );
}

function updateClock() {
  if (!dateEl) return;
  const now = dayjs();
  dateEl.textContent = now.format("YY-MM-DD HH:mm:ss");
}

function setDutyInfo() {
  if (!dutyLabelEl || !dutyNamesEl) return;
  const info = getTodayDutyInfo();
  if (info) {
    dutyLabelEl.textContent = `今日值日 第${info.weekIndex}周 ${info.weekdayLabel}`;
    dutyNamesEl.textContent = info.group.members.join(" ");
  } else {
    dutyLabelEl.textContent = "周末休息";
    dutyNamesEl.textContent = "［無值日生］";
  }

  // 次日
  if (dutyNextEl) {
    const next = getNextDutyInfo();
    dutyNextEl.textContent = (next ? `下一工作日:  ${next.group.members.join(" ")}` : "");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  dateEl = document.getElementById("date");
  dutyLabelEl = document.getElementById("duty-label");
  dutyNamesEl = document.getElementById("duty-names");
  dutyNextEl = document.getElementById("duty-next");

  const appWindow = getCurrentWindow();

  // Set up window management (touch drag + native drag snap)
  const dragArea = document.querySelector(".titlebar-drag-area") as HTMLElement | null;
  if (dragArea) initWindowManagement(dragArea, appWindow);

  const minimizeBtn = document.getElementById("titlebar-minimize");
  const closeBtn = document.getElementById("titlebar-close");

  function handleMinimize() { appWindow.minimize(); }
  function handleClose() { appWindow.close(); }

  minimizeBtn?.addEventListener("click", handleMinimize);
  closeBtn?.addEventListener("click", handleClose);
  // Touch events for touchscreen
  minimizeBtn?.addEventListener("touchstart", (e) => { e.preventDefault(); handleMinimize(); }, { passive: false });
  closeBtn?.addEventListener("touchstart", (e) => { e.preventDefault(); handleClose(); }, { passive: false });

  setDutyInfo();
  updateClock();

  // 时钟刻度
  let tick: () => void = () => {
    updateClock();
    const delay = 1000 - (dayjs().valueOf() % 1000);
    setTimeout(tick, delay);
  };
  setTimeout(tick, 1000 - (dayjs().valueOf() % 1000));

  invoke<boolean>("get_show_mode").then((showMode) => {
    if (showMode) return;

    let isVisible = true;

    function checkVisibility() {
      const shouldHide = isInHiddenPeriod(dayjs());
      if (shouldHide && isVisible) {
        document.body.style.display = 'none';
        isVisible = false;
      } else if (!shouldHide && !isVisible) {
        document.body.style.display = '';
        isVisible = true;
      }
    }

    tick = () => {
      updateClock();
      checkVisibility();
      const delay = 1000 - (dayjs().valueOf() % 1000);
      setTimeout(tick, delay);
    };

    checkVisibility();
  });
});
