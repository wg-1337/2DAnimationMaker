import React, { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { DockLayout } from './components/layout/DockLayout';
import { MenuBar } from './components/menus/MenuBar';
import { ToolBar } from './components/toolbar/ToolBar';
import { ToolOptionsBar } from './components/toolbar/ToolOptionsBar';
import { StatusBar } from './components/toolbar/StatusBar';
import { Canvas } from './components/canvas/Canvas';
import { TextEditor } from './components/canvas/TextEditor';
import { LayerHighlights } from './components/canvas/LayerHighlights';
import { Timeline } from './components/timeline/Timeline';
import { LayerPanel } from './components/panels/LayerPanel';
import { PropertyPanel } from './components/panels/PropertyPanel';
import { toolManager } from './core/tools/ToolManager';
import { registerBuiltinTools } from './core/tools/BuiltinTools';

/**
 * 应用根组件 — 阶段 2 完整组装
 * 布局: 顶部菜单栏 → DockLayout(左工具/中画布/右属性) → 底部时间轴 → 状态栏
 */
export const App: React.FC = () => {
  const layoutPreset = useAppStore((s) => s.layoutPreset);
  const activeTool = useAppStore((s) => s.activeTool);
  const zoom = useAppStore((s) => s.zoom);
  const currentFrame = useAppStore((s) => s.currentFrame);
  const totalDuration = useAppStore((s) => s.totalDuration);

  // 启动时注册所有内置工具
  useEffect(() => {
    registerBuiltinTools(toolManager);
  }, []);

  const handleMenuCommand = (commandId: string) => {
    console.log('[MenuBar] 命令:', commandId);
  };

  const handleToolSelect = (toolId: string) => {
    // 通过 ToolManager 切换工具 (会触发 activate/deactivate)
    toolManager.switchTo(toolId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* 菜单栏 */}
      <MenuBar onCommand={handleMenuCommand} />

      {/* 工具选项栏 (颜色/笔刷等) */}
      <ToolOptionsBar />

      {/* 主体区域: DockLayout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <DockLayout
          preset={layoutPreset}
          panels={[]}
          leftPanel={<ToolBar activeTool={activeTool} onToolSelect={handleToolSelect} />}
          rightPanel={
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ flex: 1, overflow: 'auto' }}>
                <PropertyPanel />
              </div>
              <div style={{ flex: 1, overflow: 'auto', borderTop: '1px solid var(--border-panel)' }}>
                <LayerPanel />
              </div>
            </div>
          }
          bottomPanel={<Timeline />}
        >
          <Canvas>
            {/* 选中图层可视化 + 文字编辑器 */}
            <LayerHighlights />
            <TextEditor />
          </Canvas>
        </DockLayout>
      </div>

      {/* 状态栏 (底部) */}
      <StatusBar
        zoom={zoom}
        canvasSize={{ width: 1920, height: 1080 }}
        fps={60}
        currentFrame={currentFrame}
        totalFrames={totalDuration}
        activeTool={activeTool}
      />
    </div>
  );
};
