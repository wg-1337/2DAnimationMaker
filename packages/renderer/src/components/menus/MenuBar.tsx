// 菜单栏组件 — 主窗口顶部菜单
// 对应 plan.md 五.5.3 工具栏 + 五.5.6 快捷键

import React, { useCallback, useState, useRef, useEffect } from 'react';
import styles from './MenuBar.module.css';

// ===== 菜单项定义 =====

interface MenuItem {
  id: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;          // 在此项前插入分隔线
  children?: MenuItem[];        // 子菜单
  action?: () => void;
}

interface MenuGroup {
  id: string;
  label: string;
  items: MenuItem[];
}

// ===== 默认菜单结构 =====

const DEFAULT_MENUS: MenuGroup[] = [
  {
    id: 'file', label: '文件',
    items: [
      { id: 'new', label: '新建项目', shortcut: 'Ctrl+N' },
      { id: 'open', label: '打开项目', shortcut: 'Ctrl+O' },
      { id: 'separator-1', label: '', separator: true },
      { id: 'save', label: '保存', shortcut: 'Ctrl+S' },
      { id: 'save-as', label: '另存为...', shortcut: 'Ctrl+Shift+S' },
      { id: 'separator-2', label: '', separator: true },
      { id: 'import', label: '导入素材...', shortcut: 'Ctrl+I' },
      { id: 'export', label: '导出...', shortcut: 'Ctrl+E' },
      { id: 'separator-3', label: '', separator: true },
      { id: 'exit', label: '退出' },
    ],
  },
  {
    id: 'edit', label: '编辑',
    items: [
      { id: 'undo', label: '撤销', shortcut: 'Ctrl+Z' },
      { id: 'redo', label: '重做', shortcut: 'Ctrl+Shift+Z' },
      { id: 'separator-e1', label: '', separator: true },
      { id: 'cut', label: '剪切', shortcut: 'Ctrl+X' },
      { id: 'copy', label: '复制', shortcut: 'Ctrl+C' },
      { id: 'paste', label: '粘贴', shortcut: 'Ctrl+V' },
      { id: 'dup', label: '复制到新图层', shortcut: 'Ctrl+D' },
      { id: 'separator-e2', label: '', separator: true },
      { id: 'delete', label: '删除', shortcut: 'Delete' },
      { id: 'select-all', label: '全选', shortcut: 'Ctrl+A' },
    ],
  },
  {
    id: 'animation', label: '动画',
    items: [
      { id: 'add-keyframe', label: '添加关键帧', shortcut: 'F6' },
      { id: 'auto-keyframe', label: '自动关键帧模式' },
      { id: 'separator-a1', label: '', separator: true },
      { id: 'easing-presets', label: '缓动预设...' },
      { id: 'graph-editor', label: '曲线编辑器' },
    ],
  },
  {
    id: 'view', label: '视图',
    items: [
      { id: 'zoom-in', label: '放大', shortcut: 'Ctrl+=' },
      { id: 'zoom-out', label: '缩小', shortcut: 'Ctrl+-' },
      { id: 'fit', label: '适应画布', shortcut: 'Ctrl+0' },
      { id: 'separator-v1', label: '', separator: true },
      { id: 'grid', label: '显示网格', shortcut: "Ctrl+'" },
      { id: 'rulers', label: '显示标尺', shortcut: 'Ctrl+R' },
      { id: 'separator-v2', label: '', separator: true },
      { id: 'layout-animation', label: '布局 → 动画' },
      { id: 'layout-editing', label: '布局 → 剪辑' },
      { id: 'layout-fullscreen', label: '布局 → 全屏', shortcut: 'F11' },
    ],
  },
  {
    id: 'help', label: '帮助',
    items: [
      { id: 'about', label: '关于 2D Animation Maker' },
      { id: 'shortcuts', label: '快捷键参考', shortcut: 'F1' },
    ],
  },
];

// ===== 组件 Props =====

export interface MenuBarProps {
  menus?: MenuGroup[];
  onCommand?: (commandId: string) => void;
}

// ===== MenuBar 组件 =====

export const MenuBar: React.FC<MenuBarProps> = ({
  menus = DEFAULT_MENUS,
  onCommand,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // 点击菜单栏外部关闭菜单
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMenuClick = useCallback((menuId: string) => {
    setOpenMenu((prev) => (prev === menuId ? null : menuId));
  }, []);

  const handleItemClick = useCallback(
    (item: MenuItem) => {
      if (item.children) return; // 有子菜单不处理
      setOpenMenu(null);
      onCommand?.(item.id);
    },
    [onCommand],
  );

  return (
    <div className={styles.menuBar} ref={barRef} role="menubar">
      {menus.map((group) => (
        <div className={styles.menuGroup} key={group.id}>
          <button
            className={`${styles.menuTrigger} ${openMenu === group.id ? styles.active : ''}`}
            onClick={() => handleMenuClick(group.id)}
            onMouseEnter={() => {
              if (openMenu !== null) setOpenMenu(group.id);
            }}
            role="menuitem"
            aria-haspopup="true"
            aria-expanded={openMenu === group.id}
          >
            {group.label}
          </button>

          {openMenu === group.id && (
            <div className={styles.dropdown} role="menu">
              {group.items.map((item) =>
                item.separator ? (
                  <div key={item.id} className={styles.separator} />
                ) : (
                  <button
                    key={item.id}
                    className={styles.menuItem}
                    disabled={item.disabled}
                    onClick={() => handleItemClick(item)}
                    role="menuitem"
                  >
                    <span className={styles.itemLabel}>{item.label}</span>
                    {item.shortcut && (
                      <span className={styles.itemShortcut}>{item.shortcut}</span>
                    )}
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      ))}

      {/* 右侧拖拽区域 (Electron 无边框窗口用) */}
      <div className={styles.dragRegion} />
    </div>
  );
};
