// 关键帧引擎 — 关键帧 CRUD / 插值 / 缓动
// 对应 plan.md 五.1.3(关键帧系统) + 五.1.4(补间动画)

import type { Keyframe, EasingType, ID } from '@animation-maker/shared';
import { useAppStore } from '../../stores/appStore';

/**
 * KeyframeManager — 关键帧操作引擎
 */
export class KeyframeManager {
  /** 添加关键帧到图层/片段 */
  addKeyframe(
    targetId: ID,
    property: string,
    frame: number,
    value: unknown,
    easing: EasingType = 'linear',
  ): Keyframe {
    const kf: Keyframe = {
      id: `kf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      frame,
      property,
      value,
      easing,
    };

    // 更新 Store 中的对应目标
    useAppStore.setState((s) => ({
      layers: s.layers.map((l) => {
        if (l.id !== targetId) return l;
        const existing = l.effects; // TODO: 图层级别关键帧存储方案
        return l;
      }),
      tracks: s.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) =>
          c.id === targetId
            ? { ...c, keyframes: [...c.keyframes, kf] }
            : c,
        ),
      })),
    }));

    return kf;
  }

  /** 删除关键帧 */
  removeKeyframe(targetId: ID, keyframeId: ID): void {
    useAppStore.setState((s) => ({
      tracks: s.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) =>
          c.id === targetId
            ? { ...c, keyframes: c.keyframes.filter((k) => k.id !== keyframeId) }
            : c,
        ),
      })),
    }));
  }

  /** 获取目标的所有关键帧 (按帧排序) */
  getKeyframes(targetId: ID, property?: string): Keyframe[] {
    const state = useAppStore.getState();
    const allKfs: Keyframe[] = [];

    for (const track of state.tracks) {
      for (const clip of track.clips) {
        if (clip.id === targetId) {
          allKfs.push(...clip.keyframes);
        }
      }
    }

    const filtered = property
      ? allKfs.filter((k) => k.property === property)
      : allKfs;

    return filtered.sort((a, b) => a.frame - b.frame);
  }

  /** 在指定帧处插值属性的值 */
  interpolate(
    targetId: ID,
    property: string,
    frame: number,
    defaultValue: number,
  ): number {
    const keyframes = this.getKeyframes(targetId, property);
    if (keyframes.length === 0) return defaultValue;

    // 找到前后关键帧
    let prev: Keyframe | null = null;
    let next: Keyframe | null = null;

    for (const kf of keyframes) {
      if (kf.frame <= frame) prev = kf;
      if (kf.frame >= frame && !next) next = kf;
    }

    if (!prev && !next) return defaultValue;
    if (!prev) return Number(next!.value);
    if (!next) return Number(prev.value);
    if (prev.frame === next.frame) return Number(prev.value);

    // 计算插值进度 t (0-1)
    const t = (frame - prev.frame) / (next.frame - prev.frame);
    const easedT = this.applyEasing(t, next.easing, next.bezier);

    const from = Number(prev.value);
    const to = Number(next.value);
    return from + (to - from) * easedT;
  }

  /** 应用缓动函数 */
  applyEasing(t: number, easing: EasingType, bezier?: [number, number, number, number]): number {
    switch (easing) {
      case 'linear':
        return t;
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return t * (2 - t);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case 'elastic':
        return this.elasticEasing(t);
      case 'bounce':
        return this.bounceEasing(t);
      case 'custom-bezier':
        return bezier ? this.bezierEasing(t, bezier) : t;
      default:
        return t;
    }
  }

  /** 弹性缓动 */
  private elasticEasing(t: number): number {
    if (t === 0 || t === 1) return t;
    return (
      Math.pow(2, -10 * t) *
      Math.sin(((t - 1) * (2 * Math.PI)) / 0.3) +
      1
    );
  }

  /** 弹跳缓动 */
  private bounceEasing(t: number): number {
    const bounce = (t: number) => {
      if (t < 1 / 2.75) return 7.5625 * t * t;
      if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    };
    return 1 - bounce(1 - t);
  }

  /** 三次贝塞尔缓动 */
  private bezierEasing(t: number, [cp1x, cp1y, cp2x, cp2y]: [number, number, number, number]): number {
    // De Casteljau 算法
    const cx = 3 * cp1x;
    const bx = 3 * (cp2x - cp1x) - cx;
    const ax = 1 - cx - bx;

    const cy = 3 * cp1y;
    const by = 3 * (cp2y - cp1y) - cy;
    const ay = 1 - cy - by;

    // Newton-Raphson 求解 x(t) 反函数
    let x = t;
    for (let i = 0; i < 8; i++) {
      const dx = ((ax * x + bx) * x + cx) * x - t;
      if (Math.abs(dx) < 0.001) break;
      x -= dx / ((3 * ax * x + 2 * bx) * x + cx);
    }

    return ((ay * x + by) * x + cy) * x;
  }
}

/** 全局关键帧管理器单例 */
export const keyframeManager = new KeyframeManager();
