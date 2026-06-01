import dayjs from "dayjs";
import { getAllWindows } from "@tauri-apps/api/window";
import { WebviewWindow, getAllWebviewWindows } from "@tauri-apps/api/webviewWindow";
import { invoke } from "@tauri-apps/api/core";
import { DutyInfo, getDutyDataByRoom, getDutyInfo, HIDDEN_PERIODS, HourNum, isInHiddenPeriod, MinuteNum } from "./duty-data";

let DUTY_CONFIG = {
  groups: [] as { [key: string]: string[] }[],
  day1: dayjs('2026-05-25')
};
const SCRN_CONFIG = {
  hiddenPeriods: HIDDEN_PERIODS
}

function setDutyInfo(date: dayjs.Dayjs, weekdayEls: NodeListOf<Element>, dutyTodayEls: NodeListOf<Element>, dutyNextEls: NodeListOf<Element>) {
  const today = date.startOf('day');
  const info = getDutyInfo(today, DUTY_CONFIG);
  console.log('dutyInfo:', info);

  const weekdayLabel = '周' + "一二三四五六日".charAt((7 + today.day() - 1) % 7) + ` (${today.format("MM/DD")})`;
  for (const weekday_el of weekdayEls) {
    weekday_el.textContent = info.groupIdx !== null
      ? `今日值日 #${info.groupIdx + 1} ${weekdayLabel}`
      : `周末休息 ${weekdayLabel}`;
  }

  for (const dutyToday_el of dutyTodayEls) {
    dutyToday_el.textContent = info.group ? Object.values(info.group)[0].join(' ') : "［無值日生］";
  }

  let next = today;
  let info_next: DutyInfo;
  do {
    next = next.add(1, 'day');
    info_next = getDutyInfo(next, DUTY_CONFIG);
  } while (info_next.group === null);

  console.log('next dutyInfo:', info_next);
  for (const dutyNext_el of dutyNextEls) {
    dutyNext_el.textContent = (info_next.group ? `下一工作日:  ${Object.values(info_next.group)[0].join(' ')}` : "------");
  }
}

const initRoom = localStorage.getItem("duty-room") || "W401";
getDutyDataByRoom(initRoom).then(groups => {
  DUTY_CONFIG.groups = groups;
  // 重新渲染
  const weekdayEls = document.querySelectorAll("time.weekday");
  const dutyTodayEls = document.querySelectorAll("p.duty-today");
  const dutyNextEls = document.querySelectorAll("p.duty-next");
  setDutyInfo(dayjs(), weekdayEls, dutyTodayEls, dutyNextEls);
}).catch(err => {
  console.error("get duty failed:", err);
});

try {
  const $all = (s: string) => document.querySelectorAll(s);
  const weekdayEls = $all("time.weekday");
  const datetimeEls = $all("time.datetime");
  const dutyTodayEls = $all("p.duty-today");
  const dutyNextEls = $all("p.duty-next");
  const settingBtns = $all("button.setting");
  const minimizeBtns = $all("button.minimize");
  const closeBtns = $all("button.close");

  const appWindow = (await getAllWindows().then(wins => wins.find(w => w.label === "board")))!;



  const bindMenuButtonFn = (btns: NodeListOf<Element>, fn: EventListener) => {
    for (const btn of btns) {
      btn.addEventListener("click", fn);
      btn.addEventListener("touchstart", (e) => { e.preventDefault(); fn(e); }, { passive: false });  // touchscreen compat
    }
  }
  bindMenuButtonFn(settingBtns, async () => {
    const existing = (await getAllWebviewWindows()).find(w => w.label === "setting");
    if (existing) { existing.close(); return; }

    const webview = new WebviewWindow("setting", {
      url: "/setting.html",
      title: "值日看板设置",
      width: 240,
      height: 560,
      x: 0,
      y: 120,
      decorations: false,
      resizable: false,
      shadow: false,
      transparent: true,
    });
    webview.once("tauri://webview-created", () => {
      webview.show();
      webview.setFocus();
    });
  });
  bindMenuButtonFn(minimizeBtns, () => appWindow.minimize());
  bindMenuButtonFn(closeBtns, () => appWindow.close());

  setDutyInfo(dayjs(), weekdayEls, dutyTodayEls, dutyNextEls);

  function updateClocks() {
    const now = dayjs();
    for (const el of datetimeEls) {
      if (!el) return;
      el.textContent = now.format("YY-MM-DD HH:mm:ss");
    }
  }

  function applyHiddenState() {
    const now = dayjs();
    const hidden = isInHiddenPeriod(now.hour() as HourNum, now.minute() as MinuteNum, SCRN_CONFIG);
    // console.log('hide:', hidden);
    if (hidden) appWindow.minimize();
    else appWindow.unminimize();
  }

  invoke<boolean>("get_show_mode").then((showMode) => {
    setTimeout(() => {
      updateClocks();
      setInterval(updateClocks, 1000);
      if (!showMode) setInterval(applyHiddenState, 1000);
    }, 1000 - (dayjs().valueOf() % 1000)); // 对齐
  });
} catch (e) { console.error(e) } // no window for bun env