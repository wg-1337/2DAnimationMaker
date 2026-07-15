# 2D Animation Maker

> 🎨 一款 70% 2D动画 + 30% 视频剪辑的跨平台软件

## 技术栈

- **UI**: React 18 + TypeScript (strict) + Vite
- **桌面**: Electron + contextBridge
- **2D渲染**: PixiJS v8 (WebGL) + WebGPU 可选
- **状态管理**: Zustand (11 slices, SSOT)
- **样式**: CSS Modules + Tailwind CSS
- **视频**: FFmpeg (静态二进制)
- **数据库**: better-sqlite3
- **测试**: Vitest + Playwright
- **Monorepo**: pnpm + Turborepo

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 类型检查
pnpm typecheck

# 运行测试
pnpm test

# 构建桌面版
pnpm build:desktop
```

## 项目结构

```
packages/
├── desktop/      # Electron 桌面应用
├── renderer/     # React 渲染进程
├── shared/       # 跨包共享代码
├── mobile/       # Android (Capacitor)
└── plugin-sdk/   # 插件开发 SDK
```

## 许可证

GPL3.0
