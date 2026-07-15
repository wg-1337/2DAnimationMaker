// 可折叠工具栏 — 左侧竖排工具面板
// 对应 plan.md 五.5.3 工具栏设计

import React, { useCallback, useState } from 'react';
import styles from './ToolBar.module.css';

// ===== 工具定义 =====

export interface ToolDefinition {
  id: string;
  name: string;
  icon: string;                // 图标文字 (暂用 Unicode，后续换 Lucide)
  shortcut?: string;
  children?: ToolDefinition[];  // 子工具组
}

// ===== 默认 9 种工具 =====

const DEFAULT_TOOLS: ToolDefinition[] = [
  { id: 'select', name: '选择/移动', icon: '🖱', shortcut: 'V' },
  { id: 'brush', name: '画笔', icon: '🖊', shortcut: 'P' },
  { id: 'pen', name: '钢笔', icon: '✒', shortcut: 'G' },
  {
    id: 'shape', name: '形状', icon: '⬛', shortcut: 'R',
    children: [
      { id: 'shape-rect', name: '矩形', icon: '▬' },
      { id: 'shape-ellipse', name: '椭圆', icon: '⬭' },
      { id: 'shape-polygon', name: '多边形', icon: '⬠' },
      { id: 'shape-star', name: '星形', icon: '★' },
    ],
  },
  { id: 'eraser', name: '橡皮擦', icon: '🩹', shortcut: 'E' },
  { id: 'fill', name: '填充', icon: '🪣', shortcut: 'G' },
  { id: 'text', name: '文本', icon: 'T', shortcut: 'T' },
  { id: 'measure', name: '测量/参考线', icon: '📏' },
  { id: 'eyedropper', name: '吸管', icon: '💉', shortcut: 'I' },
];

// ===== Props =====

export interface ToolBarProps {
  tools?: ToolDefinition[];
  activeTool?: string;
  onToolSelect?: (toolId: string) => void;
}

// ===== ToolBar 组件 =====

export const ToolBar: React.FC<ToolBarProps> = ({
  tools = DEFAULT_TOOLS,
  activeTool = 'select',
  onToolSelect,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const handleToolClick = useCallback(
    (toolId: string, hasChildren: boolean) => {
      if (hasChildren) {
        setExpandedTool((prev) => (prev === toolId ? null : toolId));
      } else {
        setExpandedTool(null);
      }
      onToolSelect?.(toolId);
    },
    [onToolSelect],
  );

  if (collapsed) {
    return (
      <div className={`${styles.toolBar} ${styles.collapsed}`}>
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={`${styles.toolBtn} ${activeTool === tool.id ? styles.active : ''}`}
            onClick={() => handleToolClick(tool.id, !!tool.children)}
            title={tool.name}
          >
            {tool.icon}
          </button>
        ))}
        <div className={styles.expandBtn}>
          <button
            onClick={() => setCollapsed(false)}
            title="展开工具栏"
          >
            ▶
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.toolBar}>
      {/* 工具列表 */}
      <div className={styles.toolList}>
        {tools.map((tool) => (
          <div key={tool.id} className={styles.toolGroup}>
            <button
              className={`${styles.toolBtn} ${activeTool === tool.id ? styles.active : ''}`}
              onClick={() => handleToolClick(tool.id, !!tool.children)}
              title={`${tool.name}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
            >
              <span className={styles.toolIcon}>{tool.icon}</span>
              <span className={styles.toolLabel}>{tool.name}</span>
              {tool.shortcut && (
                <span className={styles.toolShortcut}>{tool.shortcut}</span>
              )}
            </button>

            {/* 子工具菜单 */}
            {expandedTool === tool.id && tool.children && (
              <div className={styles.subTools}>
                {tool.children.map((sub) => (
                  <button
                    key={sub.id}
                    className={`${styles.toolBtn} ${styles.subToolBtn} ${activeTool === sub.id ? styles.active : ''}`}
                    onClick={() => handleToolClick(sub.id, false)}
                  >
                    <span className={styles.toolIcon}>{sub.icon}</span>
                    <span className={styles.toolLabel}>{sub.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 插件工具分隔区 */}
      <div className={styles.pluginSection}>
        <div className={styles.separator} />
        {/* 插件注册的工具在此渲染 */}
      </div>

      {/* 折叠按钮 */}
      <div className={styles.collapseBtn}>
        <button
          onClick={() => setCollapsed(true)}
          title="折叠工具栏"
        >
          ◀
        </button>
      </div>
    </div>
  );
};
