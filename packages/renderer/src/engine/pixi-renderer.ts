// PixiJS WebGL 渲染器 — IRenderer 接口实现
// 对应 plan.md 五.4.1 渲染引擎架构 (双引擎可切换)

import { Application, Container, Graphics, Color as PixiColor } from 'pixi.js';
import type {
  IRenderer, RenderLayer, RenderContext, RenderEffectInstance,
  Texture, TextureDescriptor, Shader, ShaderType, Buffer, BufferDescriptor,
  GPUCapabilities, RendererInfo, FrameStats, Color,
} from './renderer';
import type { Rect } from '@animation-maker/shared';

/**
 * PixiJS v8 WebGL 渲染器 — 默认渲染后端
 * MVP 阶段的基础实现，后续逐步完善渲染管线
 */
export class PixiRenderer implements IRenderer {
  private app: Application | null = null;
  private stage: Container | null = null;
  private dirtyRects: Rect[] = [];
  private frameStats: FrameStats = {
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    textureMemoryMB: 0,
    dirtyRectCount: 0,
  };
  private lastFrameTime = 0;
  private fpsCounter = 0;
  private fpsAccum = 0;

  // ---- 生命周期 ----

  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.app = new Application();
    await this.app.init({
      canvas,
      background: '#1e1e1e',
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.stage = this.app.stage;
    this.app.ticker.add(() => this.onFrame());
  }

  destroy(): void {
    this.app?.destroy(true, { children: true });
    this.app = null;
    this.stage = null;
  }

  // ---- 帧控制 ----

  beginFrame(): void {
    // 脏矩形在 getDirtyRects 中清理
  }

  endFrame(): void {
    // PixiJS 自动处理渲染，这里做统计
    this.frameStats.dirtyRectCount = this.dirtyRects.length;
  }

  // ---- 渲染操作 ----

  clear(color: Color): void {
    if (!this.app) return;
    this.app.renderer.background.color = new PixiColor({
      r: color.r, g: color.g, b: color.b, a: color.a,
    });
  }

  renderLayer(_layer: RenderLayer, _context: RenderContext): void {
    // TODO: 阶段 1 实现完整图层渲染管线
  }

  renderEffect(
    _effect: RenderEffectInstance,
    _input: Texture,
    _output: Texture,
  ): void {
    // TODO: 阶段 4 实现特效链渲染
  }

  // ---- 纹理管理 (占位) ----

  createTexture(_desc: TextureDescriptor): Texture {
    throw new Error('PixiJS 纹理创建 — 阶段 1 实现');
  }

  updateTexture(_texture: Texture, _data: ImageData): void {
    throw new Error('PixiJS 纹理更新 — 阶段 1 实现');
  }

  destroyTexture(_texture: Texture): void {
    // TODO
  }

  // ---- GPU 资源管理 (占位) ----

  createShader(_type: ShaderType, _source: string): Shader {
    throw new Error('PixiJS 着色器 — 阶段 3 实现');
  }

  createBuffer(_desc: BufferDescriptor): Buffer {
    throw new Error('PixiJS 缓冲区 — 阶段 3 实现');
  }

  // ---- 信息查询 ----

  getCapabilities(): GPUCapabilities {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return {
      renderer: gl?.getParameter(gl.RENDERER) ?? 'Unknown',
      vendor: gl?.getParameter(gl.VENDOR) ?? 'Unknown',
      maxTextureSize: gl?.getParameter(gl.MAX_TEXTURE_SIZE) ?? 4096,
      maxTextureUnits: gl?.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) ?? 8,
      webgpuAvailable: 'gpu' in navigator,
      webglVersion: gl ? 2 : 1,
    };
  }

  getRendererInfo(): RendererInfo {
    return {
      backend: 'pixi',
      version: '8.x',
      capabilities: this.getCapabilities(),
    };
  }

  getFrameStats(): FrameStats {
    return { ...this.frameStats };
  }

  // ---- 脏矩形 ----

  markDirty(rect: Rect): void {
    this.dirtyRects.push(rect);
  }

  getDirtyRects(): Rect[] {
    const rects = [...this.dirtyRects];
    this.dirtyRects = [];
    return rects;
  }

  // ---- 内部方法 ----

  private onFrame(): void {
    const now = performance.now();
    if (this.lastFrameTime > 0) {
      const dt = now - this.lastFrameTime;
      this.frameStats.frameTime = dt;
      this.fpsAccum += dt;
      this.fpsCounter++;
      if (this.fpsAccum >= 1000) {
        this.frameStats.fps = this.fpsCounter;
        this.fpsCounter = 0;
        this.fpsAccum = 0;
      }
    }
    this.lastFrameTime = now;
  }
}
