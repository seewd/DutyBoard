import { Store } from "@tauri-apps/plugin-store";
import type { DutyRoomData } from "./webfetch";

/** 持久化配置 store（文件存储） */
let _store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!_store) {
    _store = await Store.load("config.json");
  }
  return _store;
}

// ---------- 读取 ----------

export async function getRoom(): Promise<string> {
  const store = await getStore();
  return (await store.get<string>("room")) ?? "W401";
}

export async function getBoardPosition(): Promise<string> {
  const store = await getStore();
  return (await store.get<string>("boardPosition")) ?? "ml";
}

export async function getDutyData(): Promise<DutyRoomData[] | null> {
  const store = await getStore();
  return (await store.get<DutyRoomData[]>("dutyData")) ?? null;
}

// ---------- 写入 ----------

export async function setRoom(val: string): Promise<void> {
  const store = await getStore();
  await store.set("room", val);
  await store.save();
}

export async function setBoardPosition(val: string): Promise<void> {
  const store = await getStore();
  await store.set("boardPosition", val);
  await store.save();
}

export async function setDutyData(data: DutyRoomData[]): Promise<void> {
  const store = await getStore();
  await store.set("dutyData", data);
  await store.save();
}
