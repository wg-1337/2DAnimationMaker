// 画布组件 — 视口变换/坐标系/背景渲染 + 工具事件路由
// 对应 plan.md 五.4.2(渲染管线) + 九.7(坐标系统)
// 原点左上角(0,0)，Y轴向下

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { toolManager } from '../../core/tools/ToolManager';
import styles from './Canvas.module.css';

// ===== 坐标系统常量 =====

/** 坐标系定义：原点左上角，Y 轴向下（与 HTML Canvas/PixiJS 一致） */
export const COORDINATE_SYSTEM = {
  originX: 0,
  originY: 0,
  xAxisDirection: 1,
  yAxisDirection: 1,
} as const;

/** 默认缩放范围 */
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 32;

// ===== 画布组件 =====

export interface CanvasProps {
  children?: React.ReactNode;
}

export const Canvas: React.FC<CanvasProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);

  // Store 状态
  const zoom = useAppStore((s) => s.zoom);
  const panX = useAppStore((s) => s.panX);
  const panY = useAppStore((s) => s.panY);

  // 本地状态
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [localPanX, setLocalPanX] = useState(panX);
  const [localPanY, setLocalPanY] = useState(panY);
  const [localZoom, setLocalZoom] = useState(zoom);

  // ---- 坐标转换: 屏幕像素 → 画布空间 ----

  const screenToCanvas = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };

      // 屏幕上的鼠标位置 → 视口内的相对位置
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;

      // 逆视口变换 → 画布空间坐标
      const canvasX = localZoom > 0 ? (screenX - localPanX) / localZoom : screenX;
      const canvasY = localZoom > 0 ? (screenY - localPanY) / localZoom : screenY;

      return { x: canvasX, y: canvasY };
    },
    [localPanX, localPanY, localZoom],
  );

  // ---- 缩放 (使用原生事件避免 passive 警告) ----

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setLocalZoom((prev) => {
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * delta));
        if (newZoom === prev) return prev;
        const ratio = newZoom / prev;
        setLocalPanX((px) => mouseX - (mouseX - px) * ratio);
        setLocalPanY((py) => mouseY - (mouseY - py) * ratio);
        return newZoom;
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // ---- 鼠标事件 → 路由给工具 ----

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 中键 → 平移
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - localPanX, y: e.clientY - localPanY });
      return;
    }

    // 左键 → 当前工具
    if (e.button === 0) {
      const tool = toolManager.getActive();
      const coords = screenToCanvas(e.clientX, e.clientY);
      tool?.onPointerDown?.(e.nativeEvent, coords);
    }
  }, [localPanX, localPanY, screenToCanvas]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // 中键平移中
    if (isPanning) {
      setLocalPanX(e.clientX - panStart.x);
      setLocalPanY(e.clientY - panStart.y);
      return;
    }

    // 路由给工具
    const tool = toolManager.getActive();
    const coords = screenToCanvas(e.clientX, e.clientY);
    tool?.onPointerMove?.(e.nativeEvent, coords);
  }, [isPanning, panStart, screenToCanvas]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    // 路由给工具
    const tool = toolManager.getActive();
    const coords = screenToCanvas(e.clientX, e.clientY);
    tool?.onPointerUp?.(e.nativeEvent, coords);
  }, [isPanning, screenToCanvas]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // 禁用浏览器右键菜单
  }, []);

  // ---- 适配窗口 ----

  const fitToScreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    const fitZoom = Math.min((width * 0.8) / 1920, (height * 0.8) / 1080, 1);
    setLocalZoom(fitZoom);
    setLocalPanX((width - 1920 * fitZoom) / 2);
    setLocalPanY((height - 1080 * fitZoom) / 2);
  }, []);

  useEffect(() => {
    fitToScreen();
  }, [fitToScreen]);

  // ---- 渲染 ----

  const viewTransform = `matrix(${localZoom}, 0, 0, ${localZoom}, ${localPanX}, ${localPanY})`;

  return (
    <div
      ref={containerRef}
      className={styles.canvasContainer}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={handleContextMenu}
    >
      {/* 网格背景 */}
      <div
        className={styles.gridOverlay}
        style={{
          backgroundPosition: `${localPanX}px ${localPanY}px`,
          backgroundSize: `${64 * localZoom}px ${64 * localZoom}px`,
        }}
      />

      {/* 视口变换层 */}
      <div className={styles.viewport} style={{ transform: viewTransform }}>
        <div ref={projectRef} className={styles.projectCanvas}>
          <canvas ref={canvasRef} className={styles.renderCanvas} />
          <div className={styles.overlay}>{children}</div>
        </div>
      </div>

      {/* 缩放指示器 */}
      <div className={styles.zoomIndicator}>
        {Math.round(localZoom * 100)}%
      </div>

      {/* 原点标记 */}
      {isFinite(localPanX) && isFinite(localPanY) && (
        <div
          className={styles.originMarker}
          style={{ left: localPanX - 6, top: localPanY - 6 }}
          title="左键=使用工具 / 中键=平移 / 滚轮=缩放"
        />
      )}
    </div>
  );
};
