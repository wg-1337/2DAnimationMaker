// 洋葱皮叠加层 — 画布上方半透明显示前后帧
// 对应 plan.md 五.1.5(逐帧动画) — 洋葱皮

import React, { useMemo } from 'react';
import { frameManager } from '../../core/frame-anim/FrameManager';
import styles from './OnionSkin.module.css';

export const OnionSkin: React.FC = () => {
  const settings = frameManager.getOnionSkin();
  const { before, after } = frameManager.getOnionSkinFrames();

  const allSkins = useMemo(() => {
    if (!settings.enabled) return [];
    const result: { frame: import('../../core/frame-anim/FrameManager').FrameData; opacity: number; color: string }[] = [];

    // 前方帧 (红色调)
    before.forEach((f, i) => {
      result.push({
        frame: f,
        opacity: settings.opacity * (1 - (i + 1) / (settings.framesBefore + 1)),
        color: '#ff4444',
      });
    });

    // 后方帧 (蓝色调)
    after.forEach((f, i) => {
      result.push({
        frame: f,
        opacity: settings.opacity * (1 - i / (settings.framesAfter + 1)),
        color: '#4488ff',
      });
    });

    return result;
  }, [settings, before, after]);

  if (!settings.enabled || allSkins.length === 0) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      {allSkins.map((skin) => (
        <div
          key={skin.frame.id}
          className={styles.skinFrame}
          style={{
            opacity: skin.opacity,
            borderColor: skin.color,
          }}
        >
          {/* 帧缩略图占位 */}
          <div className={styles.framePlaceholder}>
            <span className={styles.frameLabel}>
              帧 {skin.frame.index}
              {skin.frame.label && ` - ${skin.frame.label}`}
            </span>
          </div>
        </div>
      ))}
      <div className={styles.settings}>
        <span className={styles.badge}>
          {before.length}← 洋葱皮 →{after.length}
        </span>
      </div>
    </div>
  );
};
