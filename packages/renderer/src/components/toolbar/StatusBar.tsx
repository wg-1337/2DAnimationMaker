// 状态栏组件 — 底部信息栏
// 显示缩放比例、画布尺寸、帧率、工具提示等

import React from 'react';
import styles from './StatusBar.module.css';

export interface StatusBarProps {
  zoom: number;
  canvasSize: { width: number; height: number };
  fps: number;
  currentFrame: number;
  totalFrames: number;
  activeTool?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  zoom,
  canvasSize,
  fps,
  currentFrame,
  totalFrames,
  activeTool,
}) => {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className={styles.statusBar}>
      {/* 左侧: 工具名 */}
      <div className={styles.left}>
        {activeTool && (
          <span className={styles.item}>{activeTool}</span>
        )}
      </div>

      {/* 右侧: 信息 */}
      <div className={styles.right}>
        <span className={styles.item}>
          {canvasSize.width} × {canvasSize.height}
        </span>
        <span className={styles.separator}>|</span>
        <span className={styles.item}>{zoomPercent}%</span>
        <span className={styles.separator}>|</span>
        <span className={styles.item}>
          帧: {currentFrame}/{totalFrames}
        </span>
        <span className={styles.separator}>|</span>
        <span className={styles.item}>{fps} FPS</span>
      </div>
    </div>
  );
};
