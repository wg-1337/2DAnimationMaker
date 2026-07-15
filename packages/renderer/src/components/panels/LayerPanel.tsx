// 图层面板组件 — 图层列表/可见性/锁定/混合模式
// 对应 plan.md 五.1.2(图层系统)

import React, { useCallback } from 'react';
import { useAppStore } from '../../stores/appStore';
import type { Layer, BlendMode } from '@animation-maker/shared';
import styles from './LayerPanel.module.css';

// ===== 混合模式标签 =====

const BLEND_MODE_LABELS: Record<BlendMode, string> = {
  'normal': '正常',
  'multiply': '正片叠底',
  'screen': '滤色',
  'overlay': '叠加',
  'soft-light': '柔光',
  'hard-light': '强光',
  'color-dodge': '颜色减淡',
  'color-burn': '颜色加深',
  'darken': '变暗',
  'lighten': '变亮',
  'difference': '差值',
  'exclusion': '排除',
  'hue': '色相',
  'saturation': '饱和度',
  'color': '颜色',
  'luminosity': '明度',
};

// ===== 单图层行 =====

interface LayerRowProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onToggleLocked: (id: string) => void;
  depth?: number;
}

const LayerRow: React.FC<LayerRowProps> = ({
  layer,
  isSelected,
  onSelect,
  onToggleVisible,
  onToggleLocked,
  depth = 0,
}) => {
  return (
    <>
      <div
        className={`${styles.layerRow} ${isSelected ? styles.selected : ''}`}
        style={{ paddingLeft: 12 + depth * 16 }}
        onClick={() => onSelect(layer.id)}
      >
        {/* 可见性 */}
        <button
          className={styles.iconBtn}
          onClick={(e) => { e.stopPropagation(); onToggleVisible(layer.id); }}
          title={layer.visible ? '隐藏图层' : '显示图层'}
        >
          {layer.visible ? '👁' : '—'}
        </button>

        {/* 锁定 */}
        <button
          className={styles.iconBtn}
          onClick={(e) => { e.stopPropagation(); onToggleLocked(layer.id); }}
          title={layer.locked ? '解锁图层' : '锁定图层'}
        >
          {layer.locked ? '🔒' : '🔓'}
        </button>

        {/* 图层名 */}
        <span className={styles.layerName}>{layer.name}</span>

        {/* 混合模式 */}
        <span className={styles.blendMode}>
          {layer.blendMode !== 'normal' ? BLEND_MODE_LABELS[layer.blendMode] : ''}
        </span>

        {/* 不透明度 */}
        <span className={styles.opacity}>
          {Math.round(layer.opacity * 100)}%
        </span>
      </div>

      {/* 子图层 (编组) */}
      {layer.children?.map((child) => (
        <LayerRow
          key={child.id}
          layer={child}
          isSelected={useAppStore.getState().selectedLayerIds.includes(child.id)}
          onSelect={onSelect}
          onToggleVisible={onToggleVisible}
          onToggleLocked={onToggleLocked}
          depth={depth + 1}
        />
      ))}
    </>
  );
};

// ===== 图层面板主体 =====

export const LayerPanel: React.FC = () => {
  const layers = useAppStore((s) => s.layers);
  const selectedIds = useAppStore((s) => s.selectedLayerIds);

  // ---- 图层操作 ----

  const handleSelect = useCallback((id: string) => {
    useAppStore.setState((s) => ({
      selectedLayerIds: s.selectedLayerIds.includes(id)
        ? s.selectedLayerIds.filter((sid) => sid !== id)
        : [...s.selectedLayerIds, id],
    }));
  }, []);

  const handleToggleVisible = useCallback((id: string) => {
    useAppStore.setState((s) => ({
      layers: s.layers.map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l,
      ),
    }));
  }, []);

  const handleToggleLocked = useCallback((id: string) => {
    useAppStore.setState((s) => ({
      layers: s.layers.map((l) =>
        l.id === id ? { ...l, locked: !l.locked } : l,
      ),
    }));
  }, []);

  const handleAddLayer = useCallback(() => {
    const newLayer: Layer = {
      id: `layer_${Date.now()}`,
      name: `图层 ${layers.length + 1}`,
      type: 'shape',
      visible: true,
      locked: false,
      transform: {
        x: 0, y: 0, scaleX: 1, scaleY: 1,
        rotation: 0, anchorX: 0.5, anchorY: 0.5, opacity: 1,
      },
      blendMode: 'normal',
      opacity: 1,
      parentId: null,
      children: [],
      effects: [],
      content: { shapeData: { type: 'rectangle', fill: '#ffffff' } },
      order: layers.length,
    };

    useAppStore.setState((s) => ({
      layers: [...s.layers, newLayer],
      selectedLayerIds: [newLayer.id],
    }));
  }, [layers]);

  const handleDeleteLayer = useCallback(() => {
    useAppStore.setState((s) => ({
      layers: s.layers.filter((l) => !s.selectedLayerIds.includes(l.id)),
      selectedLayerIds: [],
    }));
  }, []);

  // ---- 渲染 ----

  return (
    <div className={styles.panel}>
      {/* 面板标题 */}
      <div className={styles.header}>
        <span className={styles.title}>图层</span>
        <div className={styles.headerActions}>
          <button onClick={handleAddLayer} title="新建图层">+</button>
          <button
            onClick={handleDeleteLayer}
            disabled={selectedIds.length === 0}
            title="删除选中图层"
          >
            🗑
          </button>
        </div>
      </div>

      {/* 混合模式筛选 */}
      <div className={styles.filterBar}>
        <select className={styles.filterSelect} defaultValue="all">
          <option value="all">全部图层</option>
          <option value="normal">正常</option>
          <option value="effect">特效层</option>
          <option value="folder">编组</option>
        </select>
      </div>

      {/* 图层列表 */}
      <div className={styles.layerList}>
        {layers.length === 0 ? (
          <div className={styles.empty}>
            暂无图层 — 点击 + 创建
          </div>
        ) : (
          [...layers]
            .sort((a, b) => b.order - a.order) // 顶层在上
            .map((layer) => (
              <LayerRow
                key={layer.id}
                layer={layer}
                isSelected={selectedIds.includes(layer.id)}
                onSelect={handleSelect}
                onToggleVisible={handleToggleVisible}
                onToggleLocked={handleToggleLocked}
              />
            ))
        )}
      </div>
    </div>
  );
};
