// 逐帧动画系统 — 帧管理器 + 洋葱皮 + 摄影表
// 对应 plan.md 五.1.5(逐帧动画系统)

import type { ID } from '@animation-maker/shared';
import { useAppStore } from '../../stores/appStore';

// ===== 帧数据 =====

export interface FrameData {
  id: ID;
  index: number;               // 帧序号 (0-based)
  label?: string;               // 帧标签/备注
  type: 'key' | 'blank' | 'cleaned'; // 帧类型
  imageData?: ImageData;        // 帧图像数据
  duration: number;             // 持续帧数 (默认 1)
}

// ===== 洋葱皮设置 =====

export interface OnionSkinSettings {
  enabled: boolean;
  framesBefore: number;         // 显示前方帧数 (1-5)
  framesAfter: number;          // 显示后方帧数 (1-5)
  opacity: number;              // 不透明度 (0-1)
  tintColor: string;            // 着色
  mode: 'full' | 'outline';     // 显示模式
}

// ===== 绘制模式 =====

export type DrawMode = 'single' | 'continuous' | 'light-touch';

/**
 * FrameManager — 逐帧动画管理器
 */
export class FrameManager {
  private frames: FrameData[] = [];
  private currentFrameIndex = 0;
  private onionSkin: OnionSkinSettings = {
    enabled: true,
    framesBefore: 3,
    framesAfter: 2,
    opacity: 0.3,
    tintColor: '#ff0000',
    mode: 'full',
  };
  private drawMode: DrawMode = 'single';

  // ---- 帧操作 ----

  /** 添加帧 */
  addFrame(type: FrameData['type'] = 'key'): FrameData {
    const frame: FrameData = {
      id: `frame_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      index: this.frames.length,
      type,
      duration: 1,
    };

    this.frames.push(frame);
    return frame;
  }

  /** 删除帧 */
  removeFrame(index: number): void {
    this.frames = this.frames
      .filter((f) => f.index !== index)
      .map((f, i) => ({ ...f, index: i })); // 重排索引
  }

  /** 复制帧 */
  duplicateFrame(index: number): FrameData | null {
    const src = this.frames.find((f) => f.index === index);
    if (!src) return null;

    const copy: FrameData = {
      ...JSON.parse(JSON.stringify(src)),
      id: `frame_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      index: this.frames.length,
    };

    this.frames.push(copy);
    return copy;
  }

  /** 移动帧顺序 */
  moveFrame(fromIndex: number, toIndex: number): void {
    const idx = this.frames.findIndex((f) => f.index === fromIndex);
    if (idx < 0) return;

    const [moved] = this.frames.splice(idx, 1);
    const toIdx = this.frames.findIndex((f) => f.index === toIndex);
    this.frames.splice(toIdx, 0, moved);

    // 重排所有帧索引
    this.frames.forEach((f, i) => (f.index = i));
  }

  /** 获取所有帧 */
  getAllFrames(): FrameData[] {
    return [...this.frames];
  }

  /** 获取当前帧 */
  getCurrentFrame(): FrameData | null {
    return this.frames[this.currentFrameIndex] ?? null;
  }

  /** 跳转到指定帧 */
  goToFrame(index: number): void {
    this.currentFrameIndex = Math.max(0, Math.min(index, this.frames.length - 1));
    useAppStore.setState({ currentFrame: index });
  }

  /** 设置帧标签 */
  setFrameLabel(index: number, label: string): void {
    const frame = this.frames.find((f) => f.index === index);
    if (frame) frame.label = label;
  }

  // ---- 绘制模式 ----

  setDrawMode(mode: DrawMode): void {
    this.drawMode = mode;
  }

  getDrawMode(): DrawMode {
    return this.drawMode;
  }

  /** 完成一帧绘制后自动前进 (连续模式) */
  advanceFrame(): boolean {
    if (this.drawMode !== 'continuous') return false;

    if (this.currentFrameIndex < this.frames.length - 1) {
      this.currentFrameIndex++;
      return true;
    }

    // 自动创建新帧
    this.addFrame('key');
    this.currentFrameIndex++;
    return true;
  }

  // ---- 洋葱皮 ----

  getOnionSkin(): OnionSkinSettings {
    return { ...this.onionSkin };
  }

  updateOnionSkin(partial: Partial<OnionSkinSettings>): void {
    Object.assign(this.onionSkin, partial);
  }

  /** 获取洋葱皮渲染用的前后帧 */
  getOnionSkinFrames(): { before: FrameData[]; after: FrameData[] } {
    const idx = this.currentFrameIndex;
    const before: FrameData[] = [];
    const after: FrameData[] = [];

    for (let i = 1; i <= this.onionSkin.framesBefore; i++) {
      const f = this.frames[idx - i];
      if (f) before.unshift(f);
    }

    for (let i = 1; i <= this.onionSkin.framesAfter; i++) {
      const f = this.frames[idx + i];
      if (f) after.push(f);
    }

    return { before, after };
  }
}

/** 全局帧管理器单例 */
export const frameManager = new FrameManager();
