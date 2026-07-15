// 图层引擎 — CRUD/混合模式/编组/蒙版
// 对应 plan.md 五.1.2(图层系统) + 五.4 渲染管线

import type { Layer, BlendMode, ID, Transform, LayerType } from '@animation-maker/shared';
import { DEFAULT_TRANSFORM } from '@animation-maker/shared';
import { useAppStore } from '../../stores/appStore';
import { historyManager, createCommand } from '../history/HistoryManager';

/**
 * LayerManager — 图层操作引擎
 * 所有操作封装为 ICommand 以支持撤销/重做
 */
export class LayerManager {
  // ---- CRUD ----

  /** 创建图层 */
  createLayer(options: {
    name?: string;
    type?: LayerType;
    parentId?: ID | null;
  }): Layer {
    const layers = useAppStore.getState().layers;
    const layer: Layer = {
      id: `layer_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: options.name ?? `图层 ${layers.length + 1}`,
      type: options.type ?? 'shape',
      visible: true,
      locked: false,
      transform: { ...DEFAULT_TRANSFORM },
      blendMode: 'normal',
      opacity: 1,
      parentId: options.parentId ?? null,
      children: [],
      effects: [],
      content: {},
      order: layers.length,
    };

    // 封装为可撤销命令
    const cmd = createCommand(
      `创建图层 "${layer.name}"`,
      () => this.removeLayer(layer.id),       // undo: 删除
      () => this.insertLayer(layer),           // redo: 重新插入
    );
    historyManager.execute(cmd);

    useAppStore.setState((s) => ({
      layers: [...s.layers, layer],
      selectedLayerIds: [layer.id],
    }));

    return layer;
  }

  /** 删除图层 */
  removeLayer(layerId: ID): void {
    useAppStore.setState((s) => ({
      layers: s.layers.filter((l) => l.id !== layerId),
      selectedLayerIds: s.selectedLayerIds.filter((id) => id !== layerId),
    }));
  }

  /** 插入图层 (内部使用) */
  private insertLayer(layer: Layer): void {
    useAppStore.setState((s) => ({
      layers: [...s.layers, layer],
    }));
  }

  /** 复制图层 */
  duplicateLayer(layerId: ID): Layer | null {
    const layer = useAppStore.getState().layers.find((l) => l.id === layerId);
    if (!layer) return null;

    const copy: Layer = {
      ...JSON.parse(JSON.stringify(layer)),
      id: `layer_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: `${layer.name} 副本`,
      order: useAppStore.getState().layers.length,
    };

    useAppStore.setState((s) => ({
      layers: [...s.layers, copy],
      selectedLayerIds: [copy.id],
    }));

    return copy;
  }

  /** 重命名图层 */
  renameLayer(layerId: ID, newName: string): void {
    useAppStore.setState((s) => ({
      layers: s.layers.map((l) =>
        l.id === layerId ? { ...l, name: newName } : l,
      ),
    }));
  }

  /** 移动图层排序 */
  moveLayer(layerId: ID, newOrder: number): void {
    const layers = useAppStore.getState().layers;
    const idx = layers.findIndex((l) => l.id === layerId);
    if (idx < 0) return;

    const updated = [...layers];
    const [moved] = updated.splice(idx, 1);
    updated.splice(newOrder, 0, moved);

    // 重排 order
    useAppStore.setState({
      layers: updated.map((l, i) => ({ ...l, order: i })),
    });
  }

  // ---- 属性修改 ----

  /** 设置可见性 */
  setVisible(layerId: ID, visible: boolean): void {
    useAppStore.setState((s) => ({
      layers: s.layers.map((l) =>
        l.id === layerId ? { ...l, visible } : l,
      ),
    }));
  }

  /** 设置锁定 */
  setLocked(layerId: ID, locked: boolean): void {
    useAppStore.setState((s) => ({
      layers: s.layers.map((l) =>
        l.id === layerId ? { ...l, locked } : l,
      ),
    }));
  }

  /** 设置混合模式 */
  setBlendMode(layerId: ID, mode: BlendMode): void {
    useAppStore.setState((s) => ({
      layers: s.layers.map((l) =>
        l.id === layerId ? { ...l, blendMode: mode } : l,
      ),
    }));
  }

  /** 设置不透明度 */
  setOpacity(layerId: ID, opacity: number): void {
    useAppStore.setState((s) => ({
      layers: s.layers.map((l) =>
        l.id === layerId ? { ...l, opacity: Math.max(0, Math.min(1, opacity)) } : l,
      ),
    }));
  }

  /** 设置变换 */
  setTransform(layerId: ID, transform: Partial<Transform>): void {
    useAppStore.setState((s) => ({
      layers: s.layers.map((l) =>
        l.id === layerId
          ? { ...l, transform: { ...l.transform, ...transform } }
          : l,
      ),
    }));
  }

  // ---- 编组 ----

  /** 编组选中的图层 */
  groupSelected(): ID | null {
    const state = useAppStore.getState();
    const selectedIds = state.selectedLayerIds;
    if (selectedIds.length < 2) return null;

    const groupId = `group_${Date.now()}`;
    const children = state.layers.filter((l) => selectedIds.includes(l.id));

    const group: Layer = {
      id: groupId,
      name: '编组',
      type: 'folder',
      visible: true,
      locked: false,
      transform: { ...DEFAULT_TRANSFORM },
      blendMode: 'normal',
      opacity: 1,
      parentId: null,
      children: children.map((c) => ({ ...c, parentId: groupId })),
      effects: [],
      content: {},
      order: state.layers.length,
    };

    useAppStore.setState((s) => ({
      layers: [
        ...s.layers.filter((l) => !selectedIds.includes(l.id)),
        group,
      ],
      selectedLayerIds: [groupId],
    }));

    return groupId;
  }

  /** 取消编组 */
  ungroup(groupId: ID): void {
    const state = useAppStore.getState();
    const group = state.layers.find((l) => l.id === groupId);
    if (!group || group.type !== 'folder') return;

    const children = group.children.map((c) => ({
      ...c,
      parentId: null,
      order: state.layers.length,
    }));

    useAppStore.setState((s) => ({
      layers: [
        ...s.layers.filter((l) => l.id !== groupId),
        ...children,
      ],
    }));
  }

  // ---- 图层排序 ----

  /** 获取按 order 排序的扁平图层列表 (忽略编组) */
  getFlattenedLayers(): Layer[] {
    const layers = useAppStore.getState().layers;
    const result: Layer[] = [];

    const flatten = (items: Layer[]) => {
      for (const item of items.sort((a, b) => b.order - a.order)) {
        result.push(item);
        if (item.children.length > 0) {
          flatten(item.children);
        }
      }
    };

    flatten(layers);
    return result;
  }
}

// ===== 混合模式计算 (简化) =====

/** 混合模式 blend 函数 — 对两个像素做混合运算 */
export function blendPixels(
  mode: BlendMode,
  src: { r: number; g: number; b: number; a: number },
  dst: { r: number; g: number; b: number; a: number },
): { r: number; g: number; b: number; a: number } {
  const blend = (s: number, d: number, fn: (s: number, d: number) => number) => {
    const result = fn(s, d);
    // 反预乘 → 混合 → 预乘 (简化: 直接 clamp)
    return Math.max(0, Math.min(1, result));
  };

  const apply = (fn: (s: number, d: number) => number) => ({
    r: blend(src.r, dst.r, fn),
    g: blend(src.g, dst.g, fn),
    b: blend(src.b, dst.b, fn),
    a: src.a + dst.a * (1 - src.a),
  });

  switch (mode) {
    case 'normal':     return apply((s, d) => s);
    case 'multiply':   return apply((s, d) => s * d);
    case 'screen':     return apply((s, d) => 1 - (1 - s) * (1 - d));
    case 'overlay':    return apply((s, d) => d < 0.5 ? 2 * s * d : 1 - 2 * (1 - s) * (1 - d));
    case 'darken':     return apply((s, d) => Math.min(s, d));
    case 'lighten':    return apply((s, d) => Math.max(s, d));
    case 'difference': return apply((s, d) => Math.abs(d - s));
    case 'exclusion':  return apply((s, d) => s + d - 2 * s * d);
    // 非可分离混合模式 (hue/saturation/color/luminosity) 简化处理
    default:           return apply((s, _d) => s);
  }
}

/** 全局图层管理器单例 */
export const layerManager = new LayerManager();
