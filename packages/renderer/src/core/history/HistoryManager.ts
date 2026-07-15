// Command Pattern 撤销/重做系统
// 对应 plan.md 九.9 撤销/重做实现策略

import type { ICommand, GroupCommand as IGroupCommand, ID } from '@animation-maker/shared';
import { eventBus } from '../event-bus/EventBus';

/** 生成唯一命令 ID */
function generateId(): ID {
  return `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * HistoryManager — 命令模式撤销/重做管理器
 *
 * 设计决策: 使用 Command Pattern 而非 Memento (快照)
 * - Command 每次只存 delta，内存友好
 * - 支持 GroupCommand 分组操作
 * - 与 PixiJS/Canvas 渲染引用稳定性兼容
 */
export class HistoryManager {
  /** 撤销栈 */
  private undoStack: ICommand[] = [];
  /** 重做栈 */
  private redoStack: ICommand[] = [];
  /** 最大撤销步数 */
  private maxStackSize = 200;
  /** 是否正在执行 undo/redo (防止递归) */
  private isExecuting = false;
  /** 当前活动分组 */
  private activeGroup: GroupCommandImpl | null = null;

  // ---- 命令执行 ----

  /** 执行命令并推入撤销栈 */
  execute(command: ICommand): void {
    if (this.isExecuting) return;

    // 如果当前有活动分组，加入分组
    if (this.activeGroup) {
      this.activeGroup.addCommand(command);
      return;
    }

    this.undoStack.push(command);
    this.redoStack = []; // 新操作清空重做栈

    // 超出最大步数，移除最早的
    while (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }

    eventBus.emit('history:undo', { canUndo: this.canUndo, canRedo: this.canRedo });
  }

  // ---- 撤销/重做 ----

  /** 撤销一步 */
  undo(): void {
    if (!this.canUndo) return;

    this.isExecuting = true;
    try {
      const command = this.undoStack.pop()!;
      command.undo();
      this.redoStack.push(command);
    } finally {
      this.isExecuting = false;
    }

    eventBus.emit('history:undo', { canUndo: this.canUndo, canRedo: this.canRedo });
  }

  /** 重做一步 */
  redo(): void {
    if (!this.canRedo) return;

    this.isExecuting = true;
    try {
      const command = this.redoStack.pop()!;
      command.redo();
      this.undoStack.push(command);
    } finally {
      this.isExecuting = false;
    }

    eventBus.emit('history:redo', { canUndo: this.canUndo, canRedo: this.canRedo });
  }

  // ---- 分组操作 ----

  /** 开始分组 — 后续 execute() 都加入该组 */
  beginGroup(label: string): void {
    if (this.activeGroup) {
      // 嵌套分组：创建子 GroupCommand
      const subGroup = new GroupCommandImpl(label);
      this.activeGroup.addCommand(subGroup);
      this.activeGroup = subGroup;
    } else {
      this.activeGroup = new GroupCommandImpl(label);
    }
  }

  /** 结束分组 — 分组作为一个整体压入撤销栈 */
  endGroup(): void {
    if (!this.activeGroup) return;

    // 如果嵌套分组，回到父分组
    const parent = this.activeGroup.parentGroup;
    if (parent) {
      this.activeGroup = parent;
    } else {
      // 顶层分组，压入撤销栈
      if (this.activeGroup.commands.length > 0) {
        this.undoStack.push(this.activeGroup);
        this.redoStack = [];
      }
      this.activeGroup = null;
    }

    // 超出限制
    while (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
  }

  // ---- 查询 ----

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** 获取撤销栈描述列表 (用于 UI 显示) */
  getUndoLabels(): string[] {
    return this.undoStack.map((c) => c.label).reverse();
  }

  /** 获取重做栈描述列表 */
  getRedoLabels(): string[] {
    return this.redoStack.map((c) => c.label).reverse();
  }

  /** 获取当前状态快照 */
  getState(): { undoCount: number; redoCount: number } {
    return {
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
    };
  }

  // ---- 管理 ----

  /** 设置最大撤销步数 */
  setMaxStackSize(size: number): void {
    this.maxStackSize = size;
    while (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
  }

  /** 清空所有历史 */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.activeGroup = null;
    eventBus.emit('history:undo', { canUndo: false, canRedo: false });
  }
}

// ===== GroupCommand 实现 =====

class GroupCommandImpl implements IGroupCommand {
  id: string;
  label: string;
  timestamp: number;
  commands: ICommand[] = [];
  parentGroup: GroupCommandImpl | null = null;

  constructor(label: string) {
    this.id = generateId();
    this.label = label;
    this.timestamp = Date.now();
  }

  addCommand(command: ICommand): void {
    this.commands.push(command);
  }

  undo(): void {
    // 从后往前撤销子命令
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }

  redo(): void {
    // 从前往后重做子命令
    for (const cmd of this.commands) {
      cmd.redo();
    }
  }

  mergeWith(_next: ICommand): boolean {
    // 分组命令不与外部命令合并
    return false;
  }
}

// ===== 单例 =====

/** 全局 HistoryManager 单例 */
export const historyManager = new HistoryManager();

// ===== 便捷辅助函数 =====

/**
 * 创建一个简单的可撤销命令
 * 适用于不需要复杂状态的场景
 */
export function createCommand(
  label: string,
  undo: () => void,
  redo: () => void,
): ICommand {
  return {
    id: generateId(),
    label,
    timestamp: Date.now(),
    undo,
    redo,
    mergeWith: () => false,
  };
}

/**
 * 包装一个操作，自动生成 undo/redo
 * undo 和 redo 都执行同样的回调但参数不同
 */
export function createSwapCommand<T>(
  label: string,
  target: T,
  oldValue: T,
  newValue: T,
  apply: (value: T) => void,
): ICommand {
  return {
    id: generateId(),
    label,
    timestamp: Date.now(),
    undo: () => apply(oldValue),
    redo: () => apply(newValue),
    mergeWith(_next: ICommand): boolean {
      return false;
    },
  };
}
