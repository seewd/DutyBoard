import dayjs from "dayjs";
import { getAllWindows, getCurrentWindow } from "@tauri-apps/api/window";
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

let weekdayEl: Element | null = null;
let dutyTodayEl: Element | null = null;
let dutyNextEl: Element | null = null;
let datetimeEl: Element | null = null;
let titleEl: Element | null = null;

function setDutyInfo(date: dayjs.Dayjs) {
  const today = date.startOf('day');
  const info = getDutyInfo(today, DUTY_CONFIG);
  console.log('dutyInfo:', info);

  const weekdayLabel = '周' + "一二三四五六日".charAt((7 + today.day() - 1) % 7) + ` (${today.format("MM/DD")})`;
  if (weekdayEl) {
    weekdayEl.textContent = info.groupIdx !== null
      ? `今日值日 #${info.groupIdx + 1} ${weekdayLabel}`
      : `周末休息 ${weekdayLabel}`;
  }

  if (dutyTodayEl) {
    dutyTodayEl.textContent = info.group ? Object.values(info.group)[0].join(' ') : "［無值日生］";
  }

  let next = today;
  let info_next: DutyInfo;
  do {
    next = next.add(1, 'day');
    info_next = getDutyInfo(next, DUTY_CONFIG);
  } while (info_next.group === null);

  console.log('next dutyInfo:', info_next);
  if (dutyNextEl) {
    dutyNextEl.textContent = (info_next.group ? `下一工作日:  ${Object.values(info_next.group)[0].join(' ')}` : "------");
  }
}

function updateTitle(roomName: string) {
  if (titleEl) titleEl.textContent = `duty-board @ ${roomName}`;
}

export function refreshDutyInfo() {
  const initRoom = localStorage.getItem("duty-room") || "W401";
  updateTitle(initRoom);
  getDutyDataByRoom(initRoom).then(groups => {
    DUTY_CONFIG.groups = groups;
    setDutyInfo(dayjs());
  }).catch(err => {
    console.error("get duty failed:", err);
    if (dutyTodayEl) dutyTodayEl.textContent = "[服务异常]";
  });
}

refreshDutyInfo();

// 监听设置窗口发送的班级变更事件，刷新值日信息
getCurrentWindow().listen("duty-room-changed", () => {
  refreshDutyInfo();
});

try {
  const appWindow = (await getAllWindows().then(wins => wins.find(w => w.label === "board")))!;

  // 绑定 DOM 元素
  weekdayEl = document.querySelector("time.weekday");
  dutyTodayEl = document.querySelector("p.duty-today");
  dutyNextEl = document.querySelector("p.duty-next");
  datetimeEl = document.querySelector("time.datetime");
  titleEl = document.getElementById("title");
  const settingBtn = document.querySelector("button.setting");
  const minimizeBtn = document.querySelector("button.minimize");
  const closeBtn = document.querySelector("button.close");

  const bindClick = (el: Element | null, fn: EventListener) => {
    if (!el) return;
    el.addEventListener("click", fn);
    el.addEventListener("touchstart", (e) => { e.preventDefault(); fn(e); }, { passive: false });
  };

  bindClick(settingBtn, async () => {
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
  bindClick(minimizeBtn, () => appWindow.minimize());
  bindClick(closeBtn, () => appWindow.close());

  setDutyInfo(dayjs());

  function updateClocks() {
    const now = dayjs();
    if (datetimeEl) {
      datetimeEl.textContent = now.format("YY-MM-DD HH:mm:ss");
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