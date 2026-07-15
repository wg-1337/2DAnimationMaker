// preload 脚本 — 占位，T2 任务中完善
// 通过 contextBridge 安全暴露主进程 API 到渲染进程
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
  writeFile: (path: string, data: ArrayBuffer) => ipcRenderer.invoke('fs:writeFile', path, data),

  // 对话框
  showOpenDialog: (options: Electron.OpenDialogOptions) =>
    ipcRenderer.invoke('dialog:open', options),
  showSaveDialog: (options: Electron.SaveDialogOptions) =>
    ipcRenderer.invoke('dialog:save', options),

  // 系统信息
  getGPUInfo: () => ipcRenderer.invoke('system:gpuInfo'),
  getPlatform: () => process.platform,

  // 窗口控制
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
});
