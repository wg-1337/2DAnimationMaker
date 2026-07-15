// 属性面板组件 — 选中对象属性编辑
// 对应 plan.md 五.5.2(布局) 中右侧属性面板

import React, { useCallback } from 'react';
import { useAppStore } from '../../stores/appStore';
import type { Transform, BlendMode } from '@animation-maker/shared';
import styles from './PropertyPanel.module.css';

// ===== 混合模式选项 =====

const BLEND_OPTIONS: { value: BlendMode; label: string }[] = [
  { value: 'normal', label: '正常' },
  { value: 'multiply', label: '正片叠底' },
  { value: 'screen', label: '滤色' },
  { value: 'overlay', label: '叠加' },
  { value: 'soft-light', label: '柔光' },
  { value: 'hard-light', label: '强光' },
  { value: 'color-dodge', label: '颜色减淡' },
  { value: 'color-burn', label: '颜色加深' },
  { value: 'darken', label: '变暗' },
  { value: 'lighten', label: '变亮' },
  { value: 'difference', label: '差值' },
  { value: 'exclusion', label: '排除' },
  { value: 'hue', label: '色相' },
  { value: 'saturation', label: '饱和度' },
  { value: 'color', label: '颜色' },
  { value: 'luminosity', label: '明度' },
];

// ===== 数值输入组件 =====

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label, value, onChange, min, max, step = 1, suffix,
}) => (
  <div className={styles.field}>
    <label className={styles.fieldLabel}>{label}</label>
    <input
      type="number"
      className={styles.fieldInput}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
    />
    {suffix && <span className={styles.fieldSuffix}>{suffix}</span>}
  </div>
);

// ===== 属性面板主体 =====

export const PropertyPanel: React.FC = () => {
  const selectedLayerIds = useAppStore((s) => s.selectedLayerIds);
  const layers = useAppStore((s) => s.layers);

  // 找到第一个选中的图层
  const selectedLayer = layers.find((l) => selectedLayerIds.includes(l.id));

  // ---- 属性变更 ----

  const updateTransform = useCallback(
    (partial: Partial<Transform>) => {
      if (!selectedLayer) return;
      useAppStore.setState((s) => ({
        layers: s.layers.map((l) =>
          l.id === selectedLayer.id
            ? { ...l, transform: { ...l.transform, ...partial } }
            : l,
        ),
      }));
    },
    [selectedLayer],
  );

  const updateBlendMode = useCallback(
    (mode: BlendMode) => {
      if (!selectedLayer) return;
      useAppStore.setState((s) => ({
        layers: s.layers.map((l) =>
          l.id === selectedLayer.id ? { ...l, blendMode: mode } : l,
        ),
      }));
    },
    [selectedLayer],
  );

  const updateOpacity = useCallback(
    (opacity: number) => {
      if (!selectedLayer) return;
      useAppStore.setState((s) => ({
        layers: s.layers.map((l) =>
          l.id === selectedLayer.id
            ? { ...l, opacity: Math.max(0, Math.min(1, opacity / 100)) }
            : l,
        ),
      }));
    },
    [selectedLayer],
  );

  // ---- 无选中 ----

  if (!selectedLayer) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.title}>属性</span>
        </div>
        <div className={styles.empty}>
          {selectedLayerIds.length === 0
            ? '未选中任何图层'
            : `选中 ${selectedLayerIds.length} 个图层`}
        </div>
      </div>
    );
  }

  const t = selectedLayer.transform;

  return (
    <div className={styles.panel}>
      {/* 面板标题 */}
      <div className={styles.header}>
        <span className={styles.title}>属性</span>
        <span className={styles.layerName}>{selectedLayer.name}</span>
      </div>

      {/* 变换属性 */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>变换</div>

        <NumberInput label="X" value={t.x} onChange={(v) => updateTransform({ x: v })} />
        <NumberInput label="Y" value={t.y} onChange={(v) => updateTransform({ y: v })} />

        <NumberInput
          label="缩放 W" value={Math.round(t.scaleX * 100)}
          onChange={(v) => updateTransform({ scaleX: v / 100, scaleY: v / 100 })}
          min={0} max={1000} suffix="%"
        />
        <NumberInput
          label="缩放 H" value={Math.round(t.scaleY * 100)}
          onChange={(v) => updateTransform({ scaleY: v / 100 })}
          min={0} max={1000} suffix="%"
        />

        <NumberInput
          label="旋转" value={Math.round((t.rotation * 180) / Math.PI)}
          onChange={(v) => updateTransform({ rotation: (v * Math.PI) / 180 })}
          min={-360} max={360} suffix="°"
        />
      </div>

      {/* 外观 */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>外观</div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>不透明度</label>
          <input
            type="range"
            className={styles.fieldSlider}
            value={Math.round(selectedLayer.opacity * 100)}
            onChange={(e) => updateOpacity(Number(e.target.value))}
            min={0}
            max={100}
          />
          <span className={styles.fieldSuffix}>
            {Math.round(selectedLayer.opacity * 100)}%
          </span>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>混合模式</label>
          <select
            className={styles.fieldSelect}
            value={selectedLayer.blendMode}
            onChange={(e) => updateBlendMode(e.target.value as BlendMode)}
          >
            {BLEND_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 锚点 */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>锚点</div>
        <NumberInput
          label="锚点 X" value={t.anchorX}
          onChange={(v) => updateTransform({ anchorX: Math.max(0, Math.min(1, v)) })}
          min={0} max={1} step={0.01}
        />
        <NumberInput
          label="锚点 Y" value={t.anchorY}
          onChange={(v) => updateTransform({ anchorY: Math.max(0, Math.min(1, v)) })}
          min={0} max={1} step={0.01}
        />
      </div>

      {/* 特效列表 */}
      {selectedLayer.effects.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>特效</div>
          {selectedLayer.effects.map((eff) => (
            <div key={eff.id} className={styles.effectItem}>
              <span className={styles.effectName}>{eff.effectId}</span>
              <span className={styles.effectStatus}>
                {eff.enabled ? '✅' : '⏸'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
