# Duty Board

零技术含量的值日轮值看板.

以下ai代总结.

## 功能

- 自动显示当日值日生名单(按3周15组轮换)
- 黄色大字醒目展示
- 显示当天&下一工作日值日生
- 上课时段按课表时间隐藏窗口
- 触摸拖拽, 吸附屏幕边界
- cli参数`--show`忽略自动隐藏

## 技术栈

|||
|---|---|
| 框架 | [Tauri 2](https://v2.tauri.app/) |
| 前端 | TypeScript + Vite |
| 后端 | Rust |
| 日期 | dayjs + dayjs-business-days2 |

## 开发

```bash
bun i
cargo tauri dev
```

## 构建

```bash
cargo tauri build
```

如需发布版常显:

```bash
cargo tauri build -- --features show
```

## 推荐 vsc 插件

- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
