import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { getDutyDataByRoom, getAllRoomsData, getCurrentGroups } from "./duty-data";

const appWindow = getCurrentWindow();

let currentRoom = localStorage.getItem("duty-room") || "W401";

// 标题栏按钮
document.querySelectorAll("button.close").forEach(btn => {
  btn.addEventListener("click", () => appWindow.close());
});

// 自启动开关
const autostartToggle = document.getElementById("autostart-toggle") as HTMLInputElement | null;
if (autostartToggle) {
  invoke<boolean>("plugin:autostart|is_enabled").then((enabled) => {
    autostartToggle.checked = enabled;
  }).catch(() => { });

  autostartToggle.addEventListener("change", async () => {
    try {
      if (autostartToggle.checked) {
        await invoke("plugin:autostart|enable");
        console.log("已启用开机自启动");
      } else {
        await invoke("plugin:autostart|disable");
        console.log("已禁用开机自启动");
      }
    } catch (e) {
      console.error("自启动设置失败", e);
      autostartToggle.checked = !autostartToggle.checked;
    }
  });
}

// 生成值日组表格
function buildDutyTable() {
  const tbody = document.getElementById("duty-table-body");
  if (!tbody) return;

  const groups = getCurrentGroups();
  tbody.innerHTML = "";

  groups.forEach((group, i) => {
    const tr = document.createElement("tr");

    // 第一列: 周期标签
    const tdLabel = document.createElement("td");
    tdLabel.textContent = `#${i + 1}`;
    tr.appendChild(tdLabel);

    const names = Object.values(group)[0];
    [0, 1, 2].forEach(j => {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = "text";
      input.value = names[j] ?? "";
      input.placeholder = "空位";
      td.appendChild(input);
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

function fillRoomSelect(rooms: string[]) {
  const sel = document.getElementById("room-select") as HTMLSelectElement;
  if (!sel) return;
  sel.innerHTML = "";
  for (const room of rooms) {
    const opt = document.createElement("option");
    opt.value = room;
    opt.textContent = room;
    sel.appendChild(opt);
  }
  sel.value = currentRoom;

  sel.addEventListener("change", async () => {
    currentRoom = sel.value;
    localStorage.setItem("duty-room", currentRoom);
    await getDutyDataByRoom(currentRoom);
    buildDutyTable();
  });
}

(async () => {
  await getDutyDataByRoom(currentRoom);
  const rooms = getAllRoomsData();
  if (rooms.length > 0) fillRoomSelect(rooms);
  buildDutyTable();
})();
