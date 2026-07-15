// Zustand Store — 11-slice 单根 Store
// 对应 plan.md 九.10 Store 架构 (SSOT 原则)

import { create } from 'zustand';
import type {
  Project, Track, Clip, Layer, Keyframe, Asset,
  Transform, LayoutPreset, PanelState, AppSettings,
  ExportTask, ExportPreset, InstalledPlugin,
  ShortcutBinding,
} from '@animation-maker/shared';

// ===== Slice 状态类型 =====

export interface ProjectSlice {
  currentProject: Project | null;
  isDirty: boolean;               // 未保存修改
  recentProjects: { path: string; name: string; openedAt: string }[];
}

export interface TimelineSlice {
  tracks: Track[];
  currentFrame: number;           // 播放头位置
  totalDuration: number;          // 总时长 (帧)
  isPlaying: boolean;
  zoom: number;                   // 时间轴缩放级别
  inPoint: number | null;         // 入点
  outPoint: number | null;        // 出点
}

export interface LayersSlice {
  layers: Layer[];
  selectedLayerIds: string[];
}

export interface ToolsSlice {
  activeTool: string;
  /** 工具选项: 颜色、笔刷大小等 */
  toolOptions: {
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    brushSize: number;
    brushOpacity: number;
    fontSize: number;
    fontFamily: string;
  };
}

export interface CanvasSlice {
  zoom: number;                   // 画布缩放
  panX: number;                   // 画布平移 X
  panY: number;                   // 画布平移 Y
  referenceLines: { axis: 'horizontal' | 'vertical'; position: number }[];
}

export interface UISlice {
  layoutPreset: LayoutPreset;
  panels: PanelState[];
  sidebarVisible: boolean;
  theme: 'dark' | 'light';
}

export interface PluginsSlice {
  installed: InstalledPlugin[];
  activePlugins: string[];       // 已激活的插件 ID 列表
}

export interface SettingsSlice {
  settings: AppSettings | null;
}

export interface ExportSlice {
  queue: ExportTask[];
  presets: ExportPreset[];
}

export interface SelectionSlice {
  selectedClipIds: string[];
  selectedKeyframeIds: string[];
  selectedAssetIds: string[];
}

export interface HistorySlice {
  undoStack: unknown[];           // ICommand[]
  redoStack: unknown[];           // ICommand[]
  canUndo: boolean;
  canRedo: boolean;
}

// ===== 合并 Store =====

export interface AppStore
  extends ProjectSlice,
    TimelineSlice,
    LayersSlice,
    ToolsSlice,
    CanvasSlice,
    UISlice,
    PluginsSlice,
    SettingsSlice,
    ExportSlice,
    SelectionSlice,
    HistorySlice
{
  // 顶层 actions
  resetAll: () => void;
}

// ===== 初始状态 =====

const initialProject: ProjectSlice = {
  currentProject: null,
  isDirty: false,
  recentProjects: [],
};

const initialTimeline: TimelineSlice = {
  tracks: [],
  currentFrame: 0,
  totalDuration: 300,             // 默认 300 帧
  isPlaying: false,
  zoom: 1,
  inPoint: null,
  outPoint: null,
};

const initialLayers: LayersSlice = {
  layers: [],
  selectedLayerIds: [],
};

const initialTools: ToolsSlice = {
  activeTool: 'select',
  toolOptions: {
    fillColor: '#4a90d9',
    strokeColor: '#ffffff',
    strokeWidth: 2,
    brushSize: 5,
    brushOpacity: 1,
    fontSize: 32,
    fontFamily: 'sans-serif',
  },
};

const initialCanvas: CanvasSlice = {
  zoom: 1,
  panX: 0,
  panY: 0,
  referenceLines: [],
};

const initialUI: UISlice = {
  layoutPreset: 'animation',
  panels: [],
  sidebarVisible: true,
  theme: 'dark',
};

const initialPlugins: PluginsSlice = {
  installed: [],
  activePlugins: [],
};

const initialSettings: SettingsSlice = {
  settings: null,
};

const initialExport: ExportSlice = {
  queue: [],
  presets: [],
};

const initialSelection: SelectionSlice = {
  selectedClipIds: [],
  selectedKeyframeIds: [],
  selectedAssetIds: [],
};

const initialHistory: HistorySlice = {
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,
};

// ===== Store 创建 =====

/**
 * 单根 AppStore — 所有 Slice 合并到一个 Store
 * SSOT 原则: 渲染器不持有状态副本，每帧从 Store 读取
 */
export const useAppStore = create<AppStore>(() => ({
  ...initialProject,
  ...initialTimeline,
  ...initialLayers,
  ...initialTools,
  ...initialCanvas,
  ...initialUI,
  ...initialPlugins,
  ...initialSettings,
  ...initialExport,
  ...initialSelection,
  ...initialHistory,

  resetAll: () => {
    useAppStore.setState({
      ...initialProject,
      ...initialTimeline,
      ...initialLayers,
      ...initialTools,
      ...initialCanvas,
      ...initialUI,
      ...initialPlugins,
      ...initialSettings,
      ...initialExport,
      ...initialSelection,
      ...initialHistory,
    });
  },
}));

// ===== 便捷 Selectors =====

export const selectCurrentFrame = (s: AppStore) => s.currentFrame;
export const selectActiveTool = (s: AppStore) => s.activeTool;
export const selectLayers = (s: AppStore) => s.layers;
export const selectSelectedLayers = (s: AppStore) => s.selectedLayerIds;
export const selectTracks = (s: AppStore) => s.tracks;
export const selectIsPlaying = (s: AppStore) => s.isPlaying;
export const selectCanvasView = (s: AppStore) => ({
  zoom: s.zoom,
  panX: s.panX,
  panY: s.panY,
});
export const selectLayoutPreset = (s: AppStore) => s.layoutPreset;
export const selectTheme = (s: AppStore) => s.theme;
export const selectCanUndo = (s: AppStore) => s.canUndo;
export const selectCanRedo = (s: AppStore) => s.canRedo;
