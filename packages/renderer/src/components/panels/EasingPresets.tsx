// 缓动预设面板 — 可视化选择缓动效果
// 对应 plan.md 五.1.4(补间动画) — 缓动预设面板

import React, { useCallback } from 'react';
import { EASING_PRESETS, type EasingPreset } from '../../core/tween/TweenEngine';
import styles from './EasingPresets.module.css';

// ===== 迷你缓动曲线预览 SVG =====

const EasingCurve: React.FC<{ preset: EasingPreset }> = ({ preset }) => {
  const { easing, bezier } = preset;

  // 生成 SVG 路径
  let pathD = 'M0,24 ';

  if (easing === 'linear') {
    pathD += 'L24,0';
  } else if (easing === 'ease-in') {
    pathD += 'Q6,24 24,0';
  } else if (easing === 'ease-out') {
    pathD += 'Q18,0 24,0';
  } else if (easing === 'ease-in-out') {
    pathD += 'Q12,24 12,12 Q12,0 24,0';
  } else if (bezier) {
    const [cp1x, cp1y, cp2x, cp2y] = bezier;
    pathD += `C${cp1x * 24},${(1 - cp1y) * 24} ${cp2x * 24},${(1 - cp2y) * 24} 24,0`;
  } else {
    pathD += 'L24,0';
  }

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className={styles.curveSvg}>
      <path d={pathD} fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" />
    </svg>
  );
};

// ===== 组件 =====

export interface EasingPresetsProps {
  onSelect?: (preset: EasingPreset) => void;
  selectedId?: string;
}

export const EasingPresets: React.FC<EasingPresetsProps> = ({
  onSelect,
  selectedId = 'linear',
}) => {
  const categories = ['basic', 'elastic', 'bounce', 'back'] as const;
  const categoryLabels: Record<string, string> = {
    basic: '基础',
    elastic: '弹性',
    bounce: '弹跳',
    back: '回弹',
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>缓动预设</div>

      {categories.map((cat) => {
        const presets = EASING_PRESETS.filter((p) => p.category === cat);
        if (presets.length === 0) return null;

        return (
          <div key={cat} className={styles.category}>
            <div className={styles.categoryTitle}>{categoryLabels[cat]}</div>
            <div className={styles.grid}>
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  className={`${styles.item} ${selectedId === preset.id ? styles.selected : ''}`}
                  onClick={() => onSelect?.(preset)}
                  title={preset.name}
                >
                  <EasingCurve preset={preset} />
                  <span className={styles.itemName}>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
