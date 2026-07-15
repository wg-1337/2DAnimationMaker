// ================================================================
// 2D Animation Maker — 核心数据模型类型定义
// 对应 plan.md 第八节「关键数据模型」
// ================================================================

// ===== 基础类型 =====

/** 唯一标识符 */
export type ID = string;

/** 颜色值内部表示 (0.0 - 1.0 浮点数，预乘 Alpha) */
export interface Color {
  r: number; // 0.0 - 1.0
  g: number; // 0.0 - 1.0
  b: number; // 0.0 - 1.0
  a: number; // 0.0 - 1.0 (预乘后)
}

/** 二维向量 */
export interface Vec2 {
  x: number;
  y: number;
}

/** 矩形区域 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ===== 混合模式 =====

/** 图层混合模式 — W3C Compositing and Blending Level 2 */
export type BlendMode =
  | 'normal'           // 正常
  | 'multiply'         // 正片叠底
  | 'screen'           // 滤色
  | 'overlay'          // 叠加
  | 'soft-light'       // 柔光
  | 'hard-light'       // 强光
  | 'color-dodge'      // 颜色减淡
  | 'color-burn'       // 颜色加深
  | 'darken'           // 变暗
  | 'lighten'          // 变亮
  | 'difference'       // 差值
  | 'exclusion'        // 排除
  | 'hue'              // 色相
  | 'saturation'       // 饱和度
  | 'color'            // 颜色
  | 'luminosity';      // 明度

// ===== 缓动类型 =====

export type EasingType =
  | 'linear'           // 线性
  | 'ease-in'          // 加速
  | 'ease-out'         // 减速
  | 'ease-in-out'      // 先快后慢
  | 'elastic'          // 弹性
  | 'bounce'           // 弹跳
  | 'custom-bezier';   // 自定义贝塞尔

// ===== 变换 =====

/** 2D 变换 — 锚点归一化坐标 (0-1)，变换顺序 T×R×S×(-anchor) */
export interface Transform {
  x: number;           // 位置 X (画布坐标)
  y: number;           // 位置 Y (画布坐标)
  scaleX: number;      // 缩放 X (默认 1)
  scaleY: number;      // 缩放 Y (默认 1)
  rotation: number;    // 旋转角度 (弧度)
  anchorX: number;     // 锚点 X (归一化，默认 0.5=中心)
  anchorY: number;     // 锚点 Y (归一化，默认 0.5=中心)
  opacity: number;     // 不透明度 (0-1，默认 1)
}

/** 默认变换值 */
export const DEFAULT_TRANSFORM: Transform = {
  x: 0, y: 0,
  scaleX: 1, scaleY: 1,
  rotation: 0,
  anchorX: 0.5, anchorY: 0.5,
  opacity: 1,
};

// ===== 项目 =====

export interface Project {
  version: string;            // 项目文件版本
  name: string;               // 项目名称
  width: number;              // 画布宽度 (px)
  height: number;             // 画布高度 (px)
  fps: number;                // 帧率 (FPS)
  duration: number;           // 总时长 (帧数)
  backgroundColor: string;    // 画布背景色 (hex)
  tracks: Track[];            // 轨道列表
  assets: Asset[];            // 资源列表
  settings: ProjectSettings;
  metadata: ProjectMetadata;
}

export interface ProjectSettings {
  snapEnabled: boolean;       // 吸附开关
  snapSensitivity: number;    // 吸附灵敏度 (px)
  gridSize: number;           // 网格大小 (px)
  gridVisible: boolean;       // 网格可见
  gridColor: string;          // 网格颜色
  referenceLineColor: string; // 参考线颜色
}

export interface ProjectMetadata {
  createdAt: string;          // ISO 8601
  updatedAt: string;          // ISO 8601
  author?: string;
  description?: string;
}

// ===== 轨道 =====

export type TrackType = 'video' | 'audio' | 'effect' | 'text' | 'shape';

export interface Track {
  id: ID;
  name: string;
  type: TrackType;
  order: number;
  locked: boolean;
  visible: boolean;
  muted: boolean;             // 仅音频轨道
  color: string;              // 轨道标识色
  collapsed: boolean;         // 折叠状态
  clips: Clip[];
}

// ===== 片段 =====

export type ClipType = 'video' | 'audio' | 'image' | 'shape' | 'text' | 'effect' | 'composition';

export interface Clip {
  id: ID;
  type: ClipType;
  name: string;
  startFrame: number;         // 在时间轴上的起始帧
  duration: number;           // 时长 (帧)
  assetId?: ID;               // 关联资源 ID
  transform: Transform;       // 变换属性
  keyframes: Keyframe[];      // 关键帧列表
  effects: ClipEffect[];      // 特效列表
  blendMode: BlendMode;       // 混合模式
  opacity: number;            // 不透明度 (0-1)
  locked: boolean;            // 锁定片段
  disabled: boolean;          // 禁用片段 (不渲染)
}

// ===== 关键帧 =====

export interface Keyframe {
  id: ID;
  frame: number;              // 帧位置
  property: string;           // 属性名 (x, y, scaleX, rotation, opacity...)
  value: unknown;             // 属性值
  easing: EasingType;         // 缓动类型
  bezier?: [number, number, number, number]; // 贝塞尔控制点 [cp1x, cp1y, cp2x, cp2y]
}

/** 关键帧插值模式 */
export type KeyframeInterpolation = 'hold' | 'linear' | 'bezier' | 'auto-bezier';

// ===== 图层 =====

export type LayerType = 'shape' | 'image' | 'video' | 'text' | 'effect' | 'composition' | 'folder' | 'adjustment';

export interface Layer {
  id: ID;
  name: string;
  type: LayerType;
  visible: boolean;           // 可见性
  locked: boolean;            // 锁定
  transform: Transform;       // 变换
  blendMode: BlendMode;       // 混合模式
  opacity: number;            // 不透明度 (0-1)
  parentId: ID | null;        // 父级 ID (编组/嵌套)
  children: Layer[];          // 子图层 (编组)
  mask?: LayerMask;           // 蒙版
  effects: EffectInstance[];  // 特效实例
  content: LayerContent;      // 图层内容数据
  order: number;              // 排序
}

export interface LayerContent {
  shapeData?: ShapeData;
  imageData?: { assetId: ID };
  videoData?: { assetId: ID; meshDeform?: MeshDeform };
  textData?: TextData;
}

export interface LayerMask {
  enabled: boolean;
  inverted: boolean;          // 反转蒙版
  type: 'raster' | 'vector';  // 蒙版类型
  pathData?: string;          // SVG 路径 (矢量蒙版)
  opacity: number;            // 蒙版不透明度
}

// ===== 形状数据 =====

export interface ShapeData {
  type: 'rectangle' | 'ellipse' | 'polygon' | 'star' | 'path' | 'custom';
  width?: number;             // 形状宽度 (px)
  height?: number;            // 形状高度 (px)
  pathData?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  sides?: number;
  starRatio?: number;
}

// ===== 文本数据 =====

export interface TextData {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  color: string;
  lineHeight: number;
  letterSpacing: number;
  textAlign: 'left' | 'center' | 'right';
  wordWrap: boolean;
}

// ===== 特效 =====

export interface EffectInstance {
  id: ID;
  effectId: string;           // 特效类型 ID (如 'blur', 'glow')
  enabled: boolean;
  parameters: Record<string, unknown>;
}

export interface ClipEffect extends EffectInstance {
  keyframes: Keyframe[];      // 特效参数关键帧
}

/** 特效参数描述 — 用于 UI 面板生成 */
export interface EffectParameterDescriptor {
  id: string;
  name: string;
  type: 'number' | 'vec2' | 'color' | 'dropdown' | 'boolean' | 'slider';
  default: unknown;
  min?: number;
  max?: number;
  options?: { label: string; value: string }[];
  when?: string;              // 条件显示表达式
}

/** 特效描述 — 用于注册和发现 */
export interface EffectDescriptor {
  id: string;
  displayName: string;
  type: 'filter' | 'color' | 'distort' | 'glow' | 'shadow' | 'stylize' | 'noise' | 'transition';
  parameters: EffectParameterDescriptor[];
}

// ===== 资源/素材 =====

export interface Asset {
  id: ID;
  name: string;
  type: 'image' | 'video' | 'audio' | 'font';
  path: string;               // 文件路径
  metadata: AssetMetadata;
  thumbnail?: string;         // 缩略图路径或 base64
  proxyPath?: string;         // 代理文件路径
  tags: string[];             // 标签
  colorLabel?: string;        // 颜色标签
}

export interface AssetMetadata {
  width?: number;
  height?: number;
  duration?: number;          // 时长 (秒，视频/音频)
  frameCount?: number;        // 总帧数 (视频)
  fps?: number;               // 帧率 (视频)
  bitrate?: number;           // 码率
  codec?: string;             // 编码格式
  sampleRate?: number;        // 采样率 (音频)
  channels?: number;          // 声道数 (音频)
  fileSize: number;           // 文件大小 (bytes)
}

// ===== 骨骼动画 =====

export interface Bone {
  id: ID;
  name: string;
  parentId: ID | null;
  length: number;
  rotation: number;           // 相对父骨骼的角度 (弧度)
  position: Vec2;             // 相对父骨骼的位置
  ikEnabled: boolean;
  ikTargetId?: ID;
  ikWeight: number;           // 0-1
}

// ===== 蒙皮/变形网格 =====

export interface MeshDeform {
  rows: number;
  cols: number;
  vertices: MeshVertex[];
  weights: WeightMap[];
}

export interface MeshVertex {
  index: number;
  basePosition: Vec2;
  deformedPosition: Vec2;
}

export interface WeightMap {
  vertexIndex: number;
  boneWeights: { boneId: ID; weight: number }[];
}

// ===== 粒子发射器 =====

export interface ParticleEmitter {
  id: ID;
  enabled: boolean;
  emitterType: 'point' | 'area' | 'edge';
  rate: number;               // 每秒发射数
  lifetime: number;           // 粒子寿命 (秒)
  speed: RangeValue;
  size: RangeValue;
  startColor: string;
  endColor: string;
  gravity: Vec2;
  textureId?: ID;
  blendMode: BlendMode;
  maxParticles: number;
}

export interface RangeValue {
  min: number;
  max: number;
}

// ===== 节点图 =====

export interface NodeGraph {
  id: ID;
  name: string;
  nodes: GraphNode[];
  connections: NodeConnection[];
}

export interface GraphNode {
  id: ID;
  type: 'input' | 'output' | 'transform' | 'effect' | 'blend' | 'math' | 'color' | 'custom';
  name: string;
  position: Vec2;
  inputs: NodePort[];
  outputs: NodePort[];
  config: Record<string, unknown>;
}

export interface NodePort {
  id: ID;
  name: string;
  dataType: 'number' | 'vec2' | 'color' | 'image' | 'animation' | 'any';
  connected: boolean;
}

export interface NodeConnection {
  id: ID;
  fromNodeId: ID;
  fromPortId: ID;
  toNodeId: ID;
  toPortId: ID;
}

// ===== 转场 =====

export interface Transition {
  id: ID;
  name: string;
  type: string;
  duration: number;           // 帧
  parameters: Record<string, unknown>;
}

// ===== 导出 =====

export interface ExportTask {
  id: ID;
  projectPath: string;
  format: ExportFormat;
  resolution: { width: number; height: number };
  fps: number;
  codec: ExportCodec;
  bitrate: number;            // kbps
  range: { start: number; end: number };
  outputPath: string;
  status: ExportStatus;
  progress: number;           // 0-100
  errorMsg?: string;
}

export type ExportFormat = 'mp4' | 'webm' | 'avi' | 'mov' | 'gif' | 'png-sequence';

export type ExportCodec = 'h264' | 'h265' | 'vp9';

export type ExportStatus = 'pending' | 'rendering' | 'encoding' | 'done' | 'failed';

export interface ExportPreset {
  id: ID;
  name: string;
  format: ExportFormat;
  resolution: { width: number; height: number };
  fps: number;
  codec: ExportCodec;
  bitrate: number;
}

// ===== 字幕 =====

export interface Subtitle {
  id: ID;
  text: string;
  startTime: number;          // 秒
  endTime: number;
  style?: SubtitleStyle;
}

export interface SubtitleStyle {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  backgroundColor?: string;
  alignment?: 'left' | 'center' | 'right';
  position?: 'bottom' | 'top' | 'middle';
}

// ===== 快捷键 =====

export interface ShortcutBinding {
  key: string;
  command: string;
  when?: string;
  source: 'system' | 'plugin';
}

// ===== 插件 =====

export interface PluginManifest {
  name: string;
  version: string;
  displayName: string;
  description: string;
  author: string;
  icon?: string;
  engines: { animationMaker: string };
  categories: string[];
  requiredPermissions: PluginPermission[];
  activationEvents: string[];
  contributes: PluginContributes;
}

export type PluginPermission =
  | 'workspace.fs.read'
  | 'workspace.fs.write'
  | 'network.request'
  | 'clipboard.read'
  | 'clipboard.write'
  | 'ui.showDialog'
  | 'render.capture'
  | 'plugin.install';

export interface PluginContributes {
  commands?: PluginCommand[];
  keybindings?: { key: string; command: string; when?: string }[];
  menus?: Record<string, { command: string; group?: string; order?: number }[]>;
  tools?: PluginTool[];
  effects?: EffectDescriptor[];
  transitions?: EffectDescriptor[];
  panels?: PluginPanel[];
  themes?: Record<string, unknown>[];
  fileImporters?: { extension: string; name: string }[];
  fileExporters?: { extension: string; name: string }[];
  renderPasses?: { id: string; name: string }[];
}

export interface PluginCommand {
  command: string;
  title: string;
  category?: string;
  icon?: string;
  tooltip?: string;
  enablement?: string;
}

export interface PluginTool {
  id: string;
  displayName: string;
  icon?: string;
  cursor?: string;
  shortcut?: string;
}

export interface PluginPanel {
  id: string;
  displayName: string;
  type: 'webview';
  html: string;
  position: 'left' | 'right' | 'bottom';
  size: number;
  icon?: string;
}

export interface InstalledPlugin {
  id: string;
  manifest: PluginManifest;
  installPath: string;
  trusted: boolean;
  enabled: boolean;
  permissions: PluginPermission[];
  installedAt: string;
  updatedAt: string;
}

// ===== 设置 =====

export interface AppSettings {
  language: string;
  termMode: 'professional' | 'beginner';
  autoOpenRecent: boolean;
  editor: EditorSettings;
  render: RenderSettings;
  cache: CacheSettings;
  theme: 'dark' | 'light';
}

export interface EditorSettings {
  canvasBg: string;
  gridVisible: boolean;
  gridSize: number;
  gridColor: string;
  snapEnabled: boolean;
  snapSensitivity: number;
  referenceLineColor: string;
}

export interface RenderSettings {
  backend: 'auto' | 'pixi' | 'webgpu';
  previewQuality: 'full' | 'half' | 'quarter';
  fpsLimit: number;
  hardwareEncoding: boolean;
}

export interface CacheSettings {
  maxSizeGB: number;
  autoCleanDays: number;
}

// ===== 布局 =====

export type LayoutPreset = 'animation' | 'editing' | 'color' | 'minimal' | 'fullscreen';

export interface PanelState {
  id: string;
  visible: boolean;
  expanded: boolean;
  floating: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

// ===== 撤销/重做 =====

/** 命令模式接口 — 每个用户操作封装为 ICommand */
export interface ICommand {
  id: ID;
  label: string;
  timestamp: number;
  undo(): void;
  redo(): void;
  mergeWith(next: ICommand): boolean;
}

/** 分组命令 */
export interface GroupCommand extends ICommand {
  commands: ICommand[];
}
