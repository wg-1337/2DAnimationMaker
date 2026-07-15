// Electron 主进程 — IPC handler 注册
// 对应 plan.md 九.11 Electron 安全策略 — contextBridge 配置

import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

/** 注册所有 IPC handlers */
export function registerIpcHandlers(): void {
  // ========== 文件操作 ==========

  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    try {
      const buffer = await fs.promises.readFile(filePath);
      return buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      );
    } catch (error) {
      throw new Error(`读取文件失败: ${(error as Error).message}`);
    }
  });

  ipcMain.handle('fs:writeFile', async (_event, filePath: string, data: ArrayBuffer) => {
    try {
      await fs.promises.writeFile(filePath, Buffer.from(data));
    } catch (error) {
      throw new Error(`写入文件失败: ${(error as Error).message}`);
    }
  });

  // ========== 对话框 ==========

  ipcMain.handle('dialog:open', async (_event, options) => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return { canceled: true, filePaths: [] };
    return dialog.showOpenDialog(win, options);
  });

  ipcMain.handle('dialog:save', async (_event, options) => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return { canceled: true, filePath: '' };
    return dialog.showSaveDialog(win, options);
  });

  // ========== 系统信息 ==========

  ipcMain.handle('system:gpuInfo', async () => {
    return {
      renderer: 'WebGL',
      vendor: 'Auto-detected',
    };
  });

  // ========== 窗口控制 ==========

  ipcMain.on('window:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize();
  });

  ipcMain.on('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      win.isMaximized() ? win.unmaximize() : win.maximize();
    }
  });

  ipcMain.on('window:close', () => {
    BrowserWindow.getFocusedWindow()?.close();
  });
}
