import { Store } from "@tauri-apps/plugin-store";

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
