// 补间动画引擎 — 变换补间/缓动预设/运动路径
// 对应 plan.md 五.1.4(补间动画系统)

import type { Transform, EasingType, ID } from '@animation-maker/shared';
import { keyframeManager } from '../keyframe/KeyframeManager';

/** 补间属性 */
export type TweenProperty = 'x' | 'y' | 'scaleX' | 'scaleY' | 'rotation' | 'opacity';

/** 缓动预设 */
export interface EasingPreset {
  id: string;
  name: string;
  category: 'basic' | 'elastic' | 'bounce' | 'back';
  easing: EasingType;
  bezier?: [number, number, number, number];
  preview?: string; // 预览曲线 SVG path
}

/** 运动路径点 */
export interface MotionPathPoint {
  x: number;
  y: number;
  frame: number;
}

/**
 * TweenEngine — 补间动画引擎
 */
export class TweenEngine {
  /** 对指定目标插值所有属性 */
  interpolateTransform(targetId: ID, frame: number, base: Transform): Transform {
    return {
      x: keyframeManager.interpolate(targetId, 'x', frame, base.x),
      y: keyframeManager.interpolate(targetId, 'y', frame, base.y),
      scaleX: keyframeManager.interpolate(targetId, 'scaleX', frame, base.scaleX),
      scaleY: keyframeManager.interpolate(targetId, 'scaleY', frame, base.scaleY),
      rotation: keyframeManager.interpolate(targetId, 'rotation', frame, base.rotation),
      anchorX: base.anchorX,
      anchorY: base.anchorY,
      opacity: keyframeManager.interpolate(targetId, 'opacity', frame, base.opacity),
    };
  }

  /** 在两个变换之间做缓动插值 */
  lerpTransform(from: Transform, to: Transform, t: number): Transform {
    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
      scaleX: from.scaleX + (to.scaleX - from.scaleX) * t,
      scaleY: from.scaleY + (to.scaleY - from.scaleY) * t,
      rotation: from.rotation + (to.rotation - from.rotation) * t,
      anchorX: from.anchorX,
      anchorY: from.anchorY,
      opacity: from.opacity + (to.opacity - from.opacity) * t,
    };
  }

  /** 颜色补间 */
  lerpColor(from: string, to: string, t: number): string {
    const parse = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return { r, g, b };
    };

    const fromRgb = parse(from);
    const toRgb = parse(to);

    const r = Math.round((fromRgb.r + (toRgb.r - fromRgb.r) * t) * 255);
    const g = Math.round((fromRgb.g + (toRgb.g - fromRgb.g) * t) * 255);
    const b = Math.round((fromRgb.b + (toRgb.b - fromRgb.b) * t) * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}

// ===== 缓动预设库 =====

export const EASING_PRESETS: EasingPreset[] = [
  // 基础
  { id: 'linear', name: '线性', category: 'basic', easing: 'linear' },
  { id: 'ease-in', name: '加速', category: 'basic', easing: 'ease-in' },
  { id: 'ease-out', name: '减速', category: 'basic', easing: 'ease-out' },
  { id: 'ease-in-out', name: '先快后慢', category: 'basic', easing: 'ease-in-out' },
  // 弹性
  { id: 'elastic', name: '弹性', category: 'elastic', easing: 'elastic' },
  { id: 'elastic-in', name: '弹性入场', category: 'elastic', easing: 'custom-bezier', bezier: [0.68, -0.55, 0.265, 1.55] },
  // 弹跳
  { id: 'bounce', name: '弹跳', category: 'bounce', easing: 'bounce' },
  { id: 'bounce-out', name: '弹跳出', category: 'bounce', easing: 'custom-bezier', bezier: [0.175, 0.885, 0.32, 1.275] },
  // 回弹
  { id: 'back-in', name: '回弹入场', category: 'back', easing: 'custom-bezier', bezier: [0.6, -0.28, 0.735, 0.045] },
  { id: 'back-out', name: '回弹出', category: 'back', easing: 'custom-bezier', bezier: [0.175, 0.885, 0.32, 1.275] },
];

/** 全局补间引擎单例 */
export const tweenEngine = new TweenEngine();
