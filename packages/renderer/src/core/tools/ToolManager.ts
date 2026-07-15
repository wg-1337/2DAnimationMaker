// 工具管理器 — 工具注册/激活/切换，插件扩展点
// 对应 plan.md 五.1.1(绘图工具) + 四.4.6(插件工具注册)

import type { ToolDefinition } from '../../components/toolbar/ToolBar';
import { eventBus } from '../event-bus/EventBus';

/** 工具处理接口 — 每种工具实现此接口 */
export interface IToolHandler {
  /** 工具 ID */
  readonly id: string;
  /** 工具名称 */
  readonly name: string;
  /** 光标样式 */
  readonly cursor: string;
  /** 快捷键 */
  readonly shortcut?: string;
  /** 工具激活 */
  activate(): void;
  /** 工具停用 */
  deactivate(): void;
  /** 鼠标按下 */
  onPointerDown?(e: PointerEvent, canvasCoords: { x: number; y: number }): void;
  /** 鼠标移动 */
  onPointerMove?(e: PointerEvent, canvasCoords: { x: number; y: number }): void;
  /** 鼠标释放 */
  onPointerUp?(e: PointerEvent, canvasCoords: { x: number; y: number }): void;
  /** 键盘事件 */
  onKeyDown?(e: KeyboardEvent): void;
  /** 获取工具选项 UI (可选) */
  getOptionsUI?(): React.ReactNode;
}

/**
 * ToolManager — 集中管理所有绘图工具
 * 支持内置工具 + 插件注册工具
 */
export class ToolManager {
  private handlers = new Map<string, IToolHandler>();
  private activeToolId: string = 'select';

  /** 注册工具 */
  register(handler: IToolHandler): void {
    this.handlers.set(handler.id, handler);
  }

  /** 注销工具 */
  unregister(toolId: string): void {
    if (this.activeToolId === toolId) {
      this.switchTo('select');
    }
    this.handlers.delete(toolId);
  }

  /** 切换工具 */
  switchTo(toolId: string): void {
    const prev = this.handlers.get(this.activeToolId);
    const next = this.handlers.get(toolId);
    if (!next) return;

    // 停用旧工具
    prev?.deactivate();

    // 激活新工具
    this.activeToolId = toolId;
    next.activate();

    eventBus.emit('tool:activated', { toolId });
  }

  /** 获取当前活动工具 */
  getActive(): IToolHandler | null {
    return this.handlers.get(this.activeToolId) ?? null;
  }

  /** 获取当前活动工具 ID */
  getActiveId(): string {
    return this.activeToolId;
  }

  /** 获取所有已注册工具 */
  getAll(): IToolHandler[] {
    return [...this.handlers.values()];
  }

  /** 获取工具栏定义列表 (给 ToolBar UI 用) */
  getToolDefinitions(): ToolDefinition[] {
    return this.getAll().map((h) => ({
      id: h.id,
      name: h.name,
      icon: this.getToolIcon(h.id),
      shortcut: h.shortcut,
    }));
  }

  /** 工具图标映射 */
  private getToolIcon(id: string): string {
    const icons: Record<string, string> = {
      'select': '🖱', 'brush': '🖊', 'pen': '✒', 'shape': '⬛',
      'eraser': '🩹', 'fill': '🪣', 'text': 'T',
      'measure': '📏', 'eyedropper': '💉',
    };
    return icons[id] ?? '🔧';
  }
}

/** 全局单例 */
export const toolManager = new ToolManager();
