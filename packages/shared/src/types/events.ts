// 事件总线 — 核心事件类型定义
// 对应 plan.md 八.2 事件总线

/** 核心事件名称 */
export type CoreEvent =
  // 项目事件
  | 'project:opened'
  | 'project:saved'
  | 'project:closed'
  // 时间轴事件
  | 'timeline:frameChanged'
  | 'timeline:clipAdded'
  | 'timeline:clipRemoved'
  | 'timeline:clipModified'
  // 图层事件
  | 'layer:added'
  | 'layer:removed'
  | 'layer:selected'
  | 'layer:modified'
  // 关键帧事件
  | 'keyframe:added'
  | 'keyframe:removed'
  | 'keyframe:modified'
  // 工具事件
  | 'tool:activated'
  | 'tool:deactivated'
  // 画布事件
  | 'canvas:pointerDown'
  | 'canvas:pointerMove'
  | 'canvas:pointerUp'
  // 渲染事件
  | 'render:frameRendered'
  | 'render:exportProgress'
  // 插件事件
  | 'plugin:activated'
  | 'plugin:deactivated'
  // 选中事件
  | 'selection:changed'
  // 历史事件
  | 'history:undo'
  | 'history:redo'
  // 设置事件
  | 'settings:changed';

/** 通用事件监听器类型 */
export type EventListener<T = unknown> = (data: T) => void;

/** 事件总线接口 */
export interface IEventBus {
  /** 监听事件 */
  on<T = unknown>(event: string, listener: EventListener<T>): () => void;
  /** 一次性监听 */
  once<T = unknown>(event: string, listener: EventListener<T>): () => void;
  /** 发送事件 */
  emit<T = unknown>(event: string, data?: T): void;
  /** 移除所有监听器 */
  removeAllListeners(event?: string): void;
}
