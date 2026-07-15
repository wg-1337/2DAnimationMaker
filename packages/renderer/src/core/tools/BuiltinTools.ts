// 内置 9 种绘图工具 — 基础骨架实现
// 对应 plan.md 五.1.1(绘图工具全部 P0)

import type { IToolHandler } from './ToolManager';
import { historyManager } from '../history/HistoryManager';
import { eventBus } from '../event-bus/EventBus';
import { useAppStore } from '../../stores/appStore';

// ===== 基础工具类 =====

abstract class BaseTool implements IToolHandler {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly cursor: string;
  readonly shortcut?: string;

  activate(): void {
    useAppStore.setState({ activeTool: this.id });
  }

  deactivate(): void {
    // 默认清理
  }
}

// ===== 1. 选择/移动工具 =====

export class SelectTool extends BaseTool {
  readonly id = 'select';
  readonly name = '选择/移动';
  readonly cursor = 'default';
  readonly shortcut = 'V';

  override onPointerDown(e: PointerEvent, coords: { x: number; y: number }): void {
    // 点击选中图层 / 拖拽移动
    const layers = useAppStore.getState().layers;
    // 从顶层向下查找点击命中
    const sorted = [...layers].sort((a, b) => b.order - a.order);
    const hit = sorted.find((l) => this.hitTest(l, coords));

    if (hit) {
      useAppStore.setState({ selectedLayerIds: [hit.id] });
      eventBus.emit('layer:selected', { layerId: hit.id });
    } else {
      useAppStore.setState({ selectedLayerIds: [] });
    }
  }

  override onPointerMove(e: PointerEvent, coords: { x: number; y: number }): void {
    // 拖拽移动选中图层
    const selectedIds = useAppStore.getState().selectedLayerIds;
    if (selectedIds.length > 0 && e.buttons === 1) {
      useAppStore.setState((s) => ({
        layers: s.layers.map((l) =>
          selectedIds.includes(l.id)
            ? { ...l, transform: { ...l.transform, x: coords.x, y: coords.y } }
            : l,
        ),
      }));
    }
  }

  private hitTest(layer: import('@animation-maker/shared').Layer, coords: { x: number; y: number }): boolean {
    const t = layer.transform;
    // 简化的矩形碰撞检测
    const halfW = 50; // 默认对象半宽
    const halfH = 50;
    return (
      coords.x >= t.x - halfW &&
      coords.x <= t.x + halfW &&
      coords.y >= t.y - halfH &&
      coords.y <= t.y + halfH
    );
  }
}

// ===== 2. 画笔/铅笔 =====

export class BrushTool extends BaseTool {
  readonly id = 'brush';
  readonly name = '画笔';
  readonly cursor = 'crosshair';
  readonly shortcut = 'P';

  private isDrawing = false;

  override onPointerDown(_e: PointerEvent, _coords: { x: number; y: number }): void {
    this.isDrawing = true;
    // 开始绘制路径 (创建新图层 if needed)
    eventBus.emit('canvas:pointerDown', { toolId: 'brush' });
  }

  override onPointerMove(_e: PointerEvent, coords: { x: number; y: number }): void {
    if (!this.isDrawing) return;
    // 继续绘制路径
    eventBus.emit('canvas:pointerMove', { toolId: 'brush', coords });
  }

  override onPointerUp(_e: PointerEvent, _coords: { x: number; y: number }): void {
    this.isDrawing = false;
    eventBus.emit('canvas:pointerUp', { toolId: 'brush' });
  }
}

// ===== 3. 钢笔工具 =====

export class PenTool extends BaseTool {
  readonly id = 'pen';
  readonly name = '钢笔';
  readonly cursor = 'crosshair';
  readonly shortcut = 'G';

  override onPointerDown(_e: PointerEvent, coords: { x: number; y: number }): void {
    // 添加贝塞尔锚点
    console.log('[PenTool] 添加锚点:', coords);
  }
}

// ===== 4. 形状工具 =====

export class ShapeTool extends BaseTool {
  readonly id = 'shape';
  readonly name = '形状';
  readonly cursor = 'crosshair';
  readonly shortcut = 'R';

  override onPointerDown(_e: PointerEvent, start: { x: number; y: number }): void {
    // 开始绘制形状 (记录起点)
    this.startCoords = start;
  }

  override onPointerUp(_e: PointerEvent, end: { x: number; y: number }): void {
    if (!this.startCoords) return;
    // 根据 start → end 创建形状图层
    const layer = this.createShapeLayer(this.startCoords, end);
    useAppStore.setState((s) => ({
      layers: [...s.layers, layer],
      selectedLayerIds: [layer.id],
    }));
    this.startCoords = null;
  }

  private startCoords: { x: number; y: number } | null = null;

  private createShapeLayer(start: { x: number; y: number }, end: { x: number; y: number }) {
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);
    const cx = (start.x + end.x) / 2;
    const cy = (start.y + end.y) / 2;
    const opts = useAppStore.getState().toolOptions;
    return {
      id: `shape_${Date.now()}`,
      name: w < 20 && h < 20 ? '点' : '矩形',
      type: 'shape' as const,
      visible: true,
      locked: false,
      transform: {
        x: cx, y: cy,
        scaleX: 1, scaleY: 1, rotation: 0,
        anchorX: 0.5, anchorY: 0.5, opacity: 1,
      },
      blendMode: 'normal' as const,
      opacity: 1,
      parentId: null,
      children: [],
      effects: [],
      content: {
        shapeData: {
          type: 'rectangle',
          width: w,
          height: h,
          fill: opts.fillColor,
          stroke: opts.strokeColor,
          strokeWidth: opts.strokeWidth,
        },
      },
      order: useAppStore.getState().layers.length,
    };
  }
}

// ===== 5. 橡皮擦 =====

export class EraserTool extends BaseTool {
  readonly id = 'eraser';
  readonly name = '橡皮擦';
  readonly cursor = 'cell';
  readonly shortcut = 'E';
}

// ===== 6. 填充工具 =====

export class FillTool extends BaseTool {
  readonly id = 'fill';
  readonly name = '填充';
  readonly cursor = 'crosshair';
  readonly shortcut = 'G';

  override onPointerDown(_e: PointerEvent, _coords: { x: number; y: number }): void {
    const selectedIds = useAppStore.getState().selectedLayerIds;
    if (selectedIds.length === 0) return;
    const fillColor = useAppStore.getState().toolOptions.fillColor;
    useAppStore.setState((s) => ({
      layers: s.layers.map((l) =>
        selectedIds.includes(l.id)
          ? { ...l, content: { ...l.content, shapeData: { ...l.content.shapeData, fill: fillColor } } }
          : l,
      ),
    }));
  }
}

// ===== 7. 文本工具 =====

export class TextTool extends BaseTool {
  readonly id = 'text';
  readonly name = '文本';
  readonly cursor = 'text';
  readonly shortcut = 'T';

  override onPointerDown(_e: PointerEvent, coords: { x: number; y: number }): void {
    const opts = useAppStore.getState().toolOptions;
    const layer = {
      id: `text_${Date.now()}`,
      name: '文字',
      type: 'text' as const,
      visible: true,
      locked: false,
      transform: { x: coords.x, y: coords.y, scaleX: 1, scaleY: 1, rotation: 0, anchorX: 0.5, anchorY: 0.5, opacity: 1 },
      blendMode: 'normal' as const,
      opacity: 1,
      parentId: null,
      children: [],
      effects: [],
      content: {
        textData: {
          text: '双击编辑文字', fontFamily: opts.fontFamily, fontSize: opts.fontSize,
          fontWeight: 400, fontStyle: 'normal' as const, color: opts.fillColor,
          lineHeight: 1.5, letterSpacing: 0, textAlign: 'center' as const,
          wordWrap: true,
        },
      },
      order: useAppStore.getState().layers.length,
    };
    useAppStore.setState((s) => ({
      layers: [...s.layers, layer],
      selectedLayerIds: [layer.id],
    }));
  }
}

// ===== 8. 测量/参考线 =====

export class MeasureTool extends BaseTool {
  readonly id = 'measure';
  readonly name = '测量/参考线';
  readonly cursor = 'crosshair';
}

// ===== 9. 吸管 =====

export class EyedropperTool extends BaseTool {
  readonly id = 'eyedropper';
  readonly name = '吸管';
  readonly cursor = 'crosshair';
  readonly shortcut = 'I';
}

// ===== 注册全部内置工具 =====

export function registerBuiltinTools(manager: import('./ToolManager').ToolManager): void {
  manager.register(new SelectTool());
  manager.register(new BrushTool());
  manager.register(new PenTool());
  manager.register(new ShapeTool());
  manager.register(new EraserTool());
  manager.register(new FillTool());
  manager.register(new TextTool());
  manager.register(new MeasureTool());
  manager.register(new EyedropperTool());
}
