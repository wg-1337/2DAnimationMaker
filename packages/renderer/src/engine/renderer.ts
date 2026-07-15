// Renderer 抽象层 — 双引擎 (PixiJS WebGL ↔ WebGPU) 统一接口
// 对应 plan.md 五.4.7 渲染器抽象层接口设计

import type { Color, Rect, BlendMode, Transform } from '@animation-maker/shared';

// ===== 纹理 =====

export interface TextureDescriptor {
  width: number;
  height: number;
  format?: 'rgba8' | 'rgba16f' | 'depth';
  mipmap?: boolean;
}

export interface Texture {
  id: string;
  width: number;
  height: number;
  destroy(): void;
}

// ===== 着色器 =====

export type ShaderType = 'vertex' | 'fragment' | 'compute';

export interface Shader {
  id: string;
  type: ShaderType;
  destroy(): void;
}

// ===== 缓冲区 =====

export interface BufferDescriptor {
  size: number;
  usage: 'vertex' | 'index' | 'uniform' | 'storage';
  data?: ArrayBuffer;
}

export interface Buffer {
  id: string;
  size: number;
  update(data: ArrayBuffer, offset?: number): void;
  destroy(): void;
}

// ===== GPU 信息 =====

export interface GPUCapabilities {
  renderer: string;             // GPU 型号
  vendor: string;               // 厂商
  maxTextureSize: number;
  maxTextureUnits: number;
  webgpuAvailable: boolean;
  webglVersion: 1 | 2;
}

export interface RendererInfo {
  backend: 'pixi' | 'webgpu';
  version: string;
  capabilities: GPUCapabilities;
}

// ===== 帧统计 =====

export interface FrameStats {
  fps: number;
  frameTime: number;            // ms
  drawCalls: number;
  textureMemoryMB: number;
  dirtyRectCount: number;
}

// ===== 渲染上下文 =====

export interface RenderContext {
  frame: number;                // 当前帧
  time: number;                 // 当前时间 (秒)
  dirtyRect?: Rect;             // 脏矩形区域
  resolution: { w: number; h: number };
  quality: 'preview' | 'final';
}

// ===== 渲染图层 =====

export interface RenderLayer {
  id: string;
  type: 'shape' | 'image' | 'video' | 'text' | 'effect' | 'composition';
  transform: Transform;
  blendMode: BlendMode;
  opacity: number;
  mask?: RenderMask;
  effects: RenderEffectInstance[];
  content: unknown;             // 图层内容数据
}

export interface RenderMask {
  enabled: boolean;
  inverted: boolean;
}

export interface RenderEffectInstance {
  id: string;
  effectId: string;
  enabled: boolean;
  parameters: Record<string, unknown>;
}

// ===== Renderer 抽象接口 =====

/**
 * IRenderer — 所有渲染后端的统一抽象接口
 * - 实现类: PixiRenderer (WebGL), WebGPURenderer
 * - 运行时可通过设置切换渲染后端
 */
export interface IRenderer {
  // ---- 生命周期 ----
  init(canvas: HTMLCanvasElement): Promise<void>;
  destroy(): void;

  // ---- 帧控制 ----
  beginFrame(): void;
  endFrame(): void;

  // ---- 渲染操作 ----
  clear(color: Color): void;
  renderLayer(layer: RenderLayer, context: RenderContext): void;
  renderEffect(
    effect: RenderEffectInstance,
    input: Texture,
    output: Texture,
  ): void;

  // ---- 纹理管理 ----
  createTexture(desc: TextureDescriptor): Texture;
  updateTexture(texture: Texture, data: ImageData): void;
  destroyTexture(texture: Texture): void;

  // ---- GPU 资源管理 ----
  createShader(type: ShaderType, source: string): Shader;
  createBuffer(desc: BufferDescriptor): Buffer;

  // ---- 信息查询 ----
  getCapabilities(): GPUCapabilities;
  getRendererInfo(): RendererInfo;
  getFrameStats(): FrameStats;

  // ---- 脏矩形 ----
  /** 标记区域为脏（需要重绘） */
  markDirty(rect: Rect): void;
  /** 获取所有脏矩形并清除 */
  getDirtyRects(): Rect[];
}

// ===== 渲染器工厂 =====

export type RendererBackend = 'pixi' | 'webgpu';

/**
 * 创建渲染器实例
 * MVP 阶段仅实现 PixiRenderer，WebGPU 渲染器后续添加
 */
export async function createRenderer(
  backend: RendererBackend,
): Promise<IRenderer> {
  switch (backend) {
    case 'pixi': {
      const { PixiRenderer } = await import('./pixi-renderer');
      return new PixiRenderer();
    }
    case 'webgpu':
      throw new Error('WebGPU 渲染器尚未实现 (阶段 0 MVP)');
    default:
      throw new Error(`未知渲染后端: ${backend}`);
  }
}
