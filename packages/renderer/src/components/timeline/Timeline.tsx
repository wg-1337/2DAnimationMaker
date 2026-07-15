// 时间轴 UI 组件 — 轨道/播放头/缩放/标尺/播放控制
// 对应 plan.md 五.2.2(时间轴轨道) + 五.2.10(预览播放)

import React, { useCallback, useRef, useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import styles from './Timeline.module.css';

// ===== 时间码工具 =====

/** 帧 → SMPTE 时间码 (HH:MM:SS:FF) */
export function frameToTimecode(frame: number, fps: number): string {
  const totalSeconds = Math.floor(frame / fps);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const f = frame % fps;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
}

// ===== 常量 =====

const RULER_HEIGHT = 24;
const TRACK_HEIGHT = 32;
const TRACK_LABEL_WIDTH = 120;
const MIN_PIXELS_PER_FRAME = 0.5;
const MAX_PIXELS_PER_FRAME = 50;

// ===== 组件 =====

export const Timeline: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  // Store 状态
  const tracks = useAppStore((s) => s.tracks);
  const currentFrame = useAppStore((s) => s.currentFrame);
  const totalDuration = useAppStore((s) => s.totalDuration);
  const isPlaying = useAppStore((s) => s.isPlaying);
  const fps = 30; // 默认 30fps（后续从项目读取）

  // 本地状态
  const [pixelsPerFrame, setPixelsPerFrame] = useState(2);
  const [scrollLeft, setScrollLeft] = useState(0);

  // ---- 缩放 ----

  const handleZoomIn = useCallback(() => {
    setPixelsPerFrame((p) => Math.min(MAX_PIXELS_PER_FRAME, p * 1.25));
  }, []);

  const handleZoomOut = useCallback(() => {
    setPixelsPerFrame((p) => Math.max(MIN_PIXELS_PER_FRAME, p / 1.25));
  }, []);

  // ---- 播放头点击 ----

  const handleRulerClick = useCallback(
    (e: React.MouseEvent) => {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollLeft;
      const frame = Math.round(x / pixelsPerFrame);
      useAppStore.setState({ currentFrame: Math.max(0, Math.min(frame, totalDuration)) });
    },
    [pixelsPerFrame, scrollLeft, totalDuration],
  );

  // ---- 播放控制 ----

  const handlePlayPause = useCallback(() => {
    useAppStore.setState({ isPlaying: !isPlaying });
  }, [isPlaying]);

  const handlePrevFrame = useCallback(() => {
    useAppStore.setState((s) => ({ currentFrame: Math.max(0, s.currentFrame - 1) }));
  }, []);

  const handleNextFrame = useCallback(() => {
    useAppStore.setState((s) => ({
      currentFrame: Math.min(s.totalDuration, s.currentFrame + 1),
    }));
  }, []);

  // ---- 标尺刻度 ----

  const totalWidth = totalDuration * pixelsPerFrame;
  const rulerMarks: { frame: number; x: number; label?: string }[] = [];

  // 根据缩放级别自动调整刻度间隔
  const markInterval = pixelsPerFrame < 1 ? 10 : pixelsPerFrame < 3 ? 5 : 1;

  for (let f = 0; f <= totalDuration; f += markInterval) {
    const x = f * pixelsPerFrame;
    rulerMarks.push({
      frame: f,
      x,
      label: f % (markInterval * 5) === 0 ? frameToTimecode(f, fps) : undefined,
    });
  }

  // ---- 播放头位置 ----

  const playheadX = currentFrame * pixelsPerFrame;

  // ---- 无轨道时的占位 ----

  if (tracks.length === 0) {
    return (
      <div className={styles.timeline}>
        <div className={styles.emptyState}>
          <span>暂无轨道 — 拖入素材或创建图层开始</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.timeline} ref={containerRef}>
      {/* 顶部工具栏 */}
      <div className={styles.controls}>
        <div className={styles.playbackControls}>
          <button onClick={handlePrevFrame} title="上一帧 (←)">⏮</button>
          <button onClick={handlePlayPause} title={isPlaying ? '暂停 (Space)' : '播放 (Space)'}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button onClick={handleNextFrame} title="下一帧 (→)">⏭</button>
        </div>

        <div className={styles.timeDisplay}>
          {frameToTimecode(currentFrame, fps)}
        </div>

        <div className={styles.zoomControls}>
          <button onClick={handleZoomOut} title="缩小时间轴">−</button>
          <input
            type="range"
            min={Math.log(MIN_PIXELS_PER_FRAME)}
            max={Math.log(MAX_PIXELS_PER_FRAME)}
            step={0.1}
            value={Math.log(pixelsPerFrame)}
            onChange={(e) => setPixelsPerFrame(Math.exp(Number(e.target.value)))}
            className={styles.zoomSlider}
          />
          <button onClick={handleZoomIn} title="放大时间轴">+</button>
        </div>
      </div>

      {/* 时间轴主体 */}
      <div className={styles.body}>
        {/* 左侧轨道标签 */}
        <div className={styles.trackLabels} style={{ width: TRACK_LABEL_WIDTH }}>
          <div className={styles.rulerSpacer} style={{ height: RULER_HEIGHT }} />
          {tracks.map((track) => (
            <div
              key={track.id}
              className={styles.trackLabel}
              style={{ height: TRACK_HEIGHT }}
            >
              <span className={styles.trackType}>{track.type[0].toUpperCase()}</span>
              <span className={styles.trackName}>{track.name}</span>
              <span className={styles.trackIcons}>
                {track.locked && '🔒'}
                {!track.visible && '👁‍🗨'}
                {track.muted && '🔇'}
              </span>
            </div>
          ))}
        </div>

        {/* 右侧时间轴内容 */}
        <div
          className={styles.trackContent}
          onScroll={(e) => setScrollLeft((e.target as HTMLDivElement).scrollLeft)}
        >
          {/* 标尺 */}
          <div
            ref={rulerRef}
            className={styles.ruler}
            style={{ width: totalWidth, height: RULER_HEIGHT }}
            onClick={handleRulerClick}
          >
            {rulerMarks.map((mark) => (
              <div
                key={mark.frame}
                className={styles.rulerMark}
                style={{ left: mark.x }}
              >
                <div className={styles.rulerTick} />
                {mark.label && (
                  <span className={styles.rulerLabel}>{mark.label}</span>
                )}
              </div>
            ))}
          </div>

          {/* 轨道 */}
          {tracks.map((track) => (
            <div
              key={track.id}
              className={styles.track}
              style={{ width: totalWidth, height: TRACK_HEIGHT }}
            >
              {/* 片段占位（阶段 2 实现） */}
              {track.clips.map((clip) => (
                <div
                  key={clip.id}
                  className={styles.clip}
                  style={{
                    left: clip.startFrame * pixelsPerFrame,
                    width: clip.duration * pixelsPerFrame,
                  }}
                >
                  <span className={styles.clipName}>{clip.name}</span>
                </div>
              ))}
            </div>
          ))}

          {/* 播放头 */}
          <div
            className={styles.playhead}
            style={{ left: playheadX }}
          />
        </div>
      </div>
    </div>
  );
};
