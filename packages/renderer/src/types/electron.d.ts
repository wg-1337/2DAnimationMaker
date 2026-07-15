// Electron IPC 通道定义 — 渲染进程可调用的 IPC 通道类型
// 对应 plan.md 九.11 Electron 安全策略

export interface ElectronAPI {
  // 文件操作
  readFile: (path: string) => Promise<ArrayBuffer>;
  writeFile: (path: string, data: ArrayBuffer) => Promise<void>;

  // 对话框
  showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>;
  showSaveDialog: (options: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>;

  // FFmpeg
  executeFFmpeg: (args: string[]) => Promise<{ stdout: string; stderr: string }>;
  getFFmpegInfo: () => Promise<{ version: string; codecs: string[] }>;

  // 数据库
  dbQuery: (sql: string, params?: unknown[]) => Promise<unknown>;

  // 系统信息
  getGPUInfo: () => Promise<{ renderer: string; vendor: string }>;
  getPlatform: () => NodeJS.Platform;

  // 窗口控制
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
}

declare global {
  interface Window {
    /** Electron 主进程 API，通过 contextBridge 暴露 */
    electronAPI: ElectronAPI;
  }
}

export {};
