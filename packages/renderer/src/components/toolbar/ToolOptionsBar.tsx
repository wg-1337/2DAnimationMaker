// 工具选项栏 — 颜色/笔刷/文字等当前工具配置
import React, { useCallback } from 'react';
import { useAppStore } from '../../stores/appStore';
import styles from './ToolOptionsBar.module.css';

export const ToolOptionsBar: React.FC = () => {
  const activeTool = useAppStore((s) => s.activeTool);
  const opts = useAppStore((s) => s.toolOptions);

  const setOpt = useCallback(
    (key: string, value: string | number) => {
      useAppStore.setState((s) => ({
        toolOptions: { ...s.toolOptions, [key]: value },
      }));
    },
    [],
  );

  return (
    <div className={styles.bar}>
      {/* 填充色 — 画笔/形状/文字共用 */}
      {(activeTool === 'brush' || activeTool === 'shape' || activeTool === 'fill' || activeTool === 'text') && (
        <label className={styles.field} title="填充色">
          <span>🎨</span>
          <input
            type="color"
            value={opts.fillColor}
            onChange={(e) => setOpt('fillColor', e.target.value)}
            className={styles.colorInput}
          />
        </label>
      )}

      {/* 描边色 */}
      {activeTool === 'shape' && (
        <label className={styles.field} title="描边色">
          <span>✏️</span>
          <input
            type="color"
            value={opts.strokeColor}
            onChange={(e) => setOpt('strokeColor', e.target.value)}
            className={styles.colorInput}
          />
        </label>
      )}

      {/* 笔刷大小 */}
      {activeTool === 'brush' && (
        <label className={styles.field} title="笔刷大小">
          <span>●</span>
          <input
            type="range"
            min={1} max={50} value={opts.brushSize}
            onChange={(e) => setOpt('brushSize', Number(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.val}>{opts.brushSize}px</span>
        </label>
      )}

      {/* 笔刷不透明度 */}
      {activeTool === 'brush' && (
        <label className={styles.field} title="不透明度">
          <span>💧</span>
          <input
            type="range"
            min={0} max={100} value={Math.round(opts.brushOpacity * 100)}
            onChange={(e) => setOpt('brushOpacity', Number(e.target.value) / 100)}
            className={styles.slider}
          />
          <span className={styles.val}>{Math.round(opts.brushOpacity * 100)}%</span>
        </label>
      )}

      {/* 描边宽度 */}
      {activeTool === 'shape' && (
        <label className={styles.field} title="描边宽度">
          <span>📏</span>
          <input
            type="range"
            min={0} max={20} value={opts.strokeWidth}
            onChange={(e) => setOpt('strokeWidth', Number(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.val}>{opts.strokeWidth}px</span>
        </label>
      )}

      {/* 文字大小 */}
      {activeTool === 'text' && (
        <label className={styles.field} title="字号">
          <span> Aa </span>
          <input
            type="range"
            min={8} max={200} value={opts.fontSize}
            onChange={(e) => setOpt('fontSize', Number(e.target.value))}
            className={styles.slider}
          />
          <span className={styles.val}>{opts.fontSize}px</span>
        </label>
      )}

      {/* 选择工具提示 */}
      {activeTool === 'select' && (
        <span className={styles.hint}>点击图层选中 · 拖拽移动 · 中键平移 · 滚轮缩放</span>
      )}
      {activeTool === 'pen' && (
        <span className={styles.hint}>点击添加贝塞尔锚点</span>
      )}
    </div>
  );
};
