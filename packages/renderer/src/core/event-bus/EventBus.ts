// 事件总线实现 — 核心跨模块通信
// 对应 plan.md 八.2 事件总线 + 九.10 Store 架构

import type { EventListener, IEventBus } from '@animation-maker/shared';

/** 基于 EventTarget 的简单事件总线实现 */
export class EventBus implements IEventBus {
  private listeners = new Map<string, Set<EventListener>>();

  on<T = unknown>(event: string, listener: EventListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as EventListener);

    // 返回取消监听函数
    return () => {
      this.listeners.get(event)?.delete(listener as EventListener);
    };
  }

  once<T = unknown>(event: string, listener: EventListener<T>): () => void {
    const onceWrapper: EventListener = (data: unknown) => {
      listener(data);
      this.listeners.get(event)?.delete(onceWrapper);
    };

    return this.on(event, onceWrapper);
  }

  emit<T = unknown>(event: string, data?: T): void {
    const set = this.listeners.get(event);
    if (!set) return;

    // 复制一份遍历，防止 listener 中移除自己导致问题
    for (const listener of [...set]) {
      try {
        listener(data);
      } catch (error) {
        console.error(`[EventBus] ${event} 事件处理异常:`, error);
      }
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

/** 全局事件总线单例 */
export const eventBus = new EventBus();
