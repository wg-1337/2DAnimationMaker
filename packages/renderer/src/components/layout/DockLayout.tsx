// Dock Layout 布局系统 — 可拖拽面板布局
// 对应 plan.md 五.5.2 布局系统 + 五.5 UI/UX 交互系统

import React, { useCallback, useState } from 'react';
import type { LayoutPreset, PanelState } from '@animation-maker/shared';
import styles from './DockLayout.module.css';

// ===== Props =====

export interface DockLayoutProps {
  /** 当前布局预设 */
  preset: LayoutPreset;
  /** 面板列表 */
  panels: PanelState[];
  /** 左侧面板内容 */
  leftPanel?: React.ReactNode;
  /** 右侧面板内容 */
  rightPanel?: React.ReactNode;
  /** 底部面板内容 */
  bottomPanel?: React.ReactNode;
  /** 中央画布内容 */
  children?: React.ReactNode;
  /** 面板显隐变更 */
  onPanelToggle?: (panelId: string, visible: boolean) => void;
}

// ===== 组件 =====

/**
 * DockLayout — 可拖拽面板布局系统
 * 支持动画/剪辑/调色/精简/全屏 5 种布局预设
 * MVP 阶段实现基础固定布局，阶段 1 完善可拖拽功能
 */
export const DockLayout: React.FC<DockLayoutProps> = ({
  preset,
  leftPanel,
  rightPanel,
  bottomPanel,
  children,
  onPanelToggle,
}) => {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [bottomCollapsed, setBottomCollapsed] = useState(false);

  // 全屏模式隐藏所有面板
  const isFullscreen = preset === 'fullscreen';

  const handleToggleLeft = useCallback(() => {
    setLeftCollapsed((v) => !v);
  }, []);

  const handleToggleRight = useCallback(() => {
    setRightCollapsed((v) => !v);
  }, []);

  const handleToggleBottom = useCallback(() => {
    setBottomCollapsed((v) => !v);
  }, []);

  if (isFullscreen) {
    return <div className={styles.root}>{children}</div>;
  }

  return (
    <div className={styles.root}>
      {/* 左侧面板区 */}
      <div
        className={`${styles.panelLeft} ${leftCollapsed ? styles.collapsed : ''}`}
        data-panel="left"
      >
        {!leftCollapsed && leftPanel}
        <button
          className={styles.collapseBtn}
          onClick={handleToggleLeft}
          title={leftCollapsed ? '展开左侧面板' : '折叠左侧面板'}
        >
          {leftCollapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* 中央区域 */}
      <div className={styles.center}>
        {/* 画布 */}
        <div className={styles.canvas}>{children}</div>

        {/* 底部面板区 (时间轴) */}
        <div
          className={`${styles.panelBottom} ${bottomCollapsed ? styles.collapsed : ''}`}
          data-panel="bottom"
        >
          <div className={styles.bottomHeader}>
            <button
              className={styles.collapseBtn}
              onClick={handleToggleBottom}
              title={bottomCollapsed ? '展开底部面板' : '折叠底部面板'}
            >
              {bottomCollapsed ? '▲' : '▼'}
            </button>
          </div>
          {!bottomCollapsed && bottomPanel}
        </div>
      </div>

      {/* 右侧面板区 */}
      <div
        className={`${styles.panelRight} ${rightCollapsed ? styles.collapsed : ''}`}
        data-panel="right"
      >
        {!rightCollapsed && rightPanel}
        <button
          className={styles.collapseBtn}
          onClick={handleToggleRight}
          title={rightCollapsed ? '展开右侧面板' : '折叠右侧面板'}
        >
          {rightCollapsed ? '◀' : '▶'}
        </button>
      </div>
    </div>
  );
};
