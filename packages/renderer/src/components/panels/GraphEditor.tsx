// 曲线/图表编辑器 (Graph Editor) — 贝塞尔曲线可视化编辑
// 对应 plan.md 五.1.11(曲线/图表编辑器)

import React, { useCallback, useRef, useState } from 'react';
import type { Keyframe } from '@animation-maker/shared';
import { useAppStore } from '../../stores/appStore';
import { keyframeManager } from '../../core/keyframe/KeyframeManager';
import styles from './GraphEditor.module.css';

// ===== 属性颜色 =====

const PROPERTY_COLORS: Record<string, string> = {
  x: '#ff4444', y: '#44ff44', scaleX: '#4444ff',
  scaleY: '#8888ff', rotation: '#ffaa00', opacity: '#aa44ff',
};

// ===== 组件 =====

export const GraphEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedProperty, setSelectedProperty] = useState('x');
  const [viewScale, setViewScale] = useState({ x: 1, y: 1 });
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });

  const selectedLayerIds = useAppStore((s) => s.selectedLayerIds);
  const tracks = useAppStore((s) => s.tracks);

  // 收集关键帧数据
  const getKeyframesForProperty = useCallback(
    (property: string): Keyframe[] => {
      if (selectedLayerIds.length === 0) return [];
      const layerId = selectedLayerIds[0];

      for (const track of tracks) {
        for (const clip of track.clips) {
          // TODO: layer→clip 映射
          const kfs = clip.keyframes.filter((k) => k.property === property);
          if (kfs.length > 0) return kfs;
        }
      }
      return [];
    },
    [selectedLayerIds, tracks],
  );

  const keyframes = getKeyframesForProperty(selectedProperty);

  // 绘制曲线 (简化版)
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // 清空
    ctx.clearRect(0, 0, w, h);

    // 背景网格
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // 绘制曲线
    if (keyframes.length < 2) return;

    const color = PROPERTY_COLORS[selectedProperty] ?? '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const maxFrame = Math.max(...keyframes.map((k) => k.frame), 1);
    let firstPoint = true;

    for (let frame = 0; frame <= maxFrame; frame++) {
      const value = keyframeManager.interpolate(
        selectedLayerIds[0] ?? '',
        selectedProperty,
        frame,
        0,
      );

      const x = (frame / maxFrame) * w * viewScale.x + viewOffset.x;
      const y = h / 2 - value * 50 * viewScale.y + viewOffset.y;

      if (firstPoint) {
        ctx.moveTo(x, y);
        firstPoint = false;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // 绘制关键帧点
    for (const kf of keyframes) {
      const x = (kf.frame / maxFrame) * w * viewScale.x + viewOffset.x;
      const y = h / 2 - Number(kf.value) * 50 * viewScale.y + viewOffset.y;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

      // 贝塞尔手柄
      if (kf.easing === 'custom-bezier' && kf.bezier) {
        const [cp1x, cp1y] = kf.bezier;
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + cp1x * 30, y - cp1y * 30);
        ctx.stroke();
      }
    }
  }, [keyframes, selectedProperty, selectedLayerIds, viewScale, viewOffset]);

  // 组件挂载后绘制
  React.useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className={styles.container}>
      {/* 工具栏 */}
      <div className={styles.toolbar}>
        <select
          className={styles.propertySelect}
          value={selectedProperty}
          onChange={(e) => setSelectedProperty(e.target.value)}
        >
          {Object.entries(PROPERTY_COLORS).map(([prop, color]) => (
            <option key={prop} value={prop}>
              ● {prop}
            </option>
          ))}
        </select>

        <div className={styles.viewControls}>
          <button onClick={() => setViewScale((s) => ({ x: s.x * 0.8, y: s.y * 0.8 }))}>−</button>
          <span className={styles.zoomLabel}>
            {Math.round(viewScale.x * 100)}%
          </span>
          <button onClick={() => setViewScale((s) => ({ x: s.x * 1.25, y: s.y * 1.25 }))}>+</button>
          <button
            onClick={() => { setViewScale({ x: 1, y: 1 }); setViewOffset({ x: 0, y: 0 }); }}
            title="重置视图"
          >
            ↺
          </button>
        </div>
      </div>

      {/* 曲线画布 */}
      <div className={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={800}
          height={400}
        />
        {keyframes.length === 0 && (
          <div className={styles.empty}>
            选中图层后，添加关键帧以查看动画曲线
          </div>
        )}
      </div>

      {/* 手柄模式按钮 */}
      <div className={styles.handleModes}>
        <button className={styles.modeBtn}>自动</button>
        <button className={styles.modeBtn}>连续</button>
        <button className={styles.modeBtn}>断开</button>
      </div>
    </div>
  );
};
