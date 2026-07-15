// 时间轴关键帧编辑 UI — 在时间轴标尺上显示/编辑关键帧
// 对应 plan.md 五.1.3(关键帧系统)

import React, { useCallback } from 'react';
import { useAppStore } from '../../stores/appStore';
import { keyframeManager } from '../../core/keyframe/KeyframeManager';
import styles from './KeyframeEditor.module.css';

// ===== 属性颜色 =====

const PROPERTY_COLORS: Record<string, string> = {
  x: '#ff4444',
  y: '#44ff44',
  scaleX: '#4444ff',
  scaleY: '#8888ff',
  rotation: '#ffaa00',
  opacity: '#aa44ff',
};

// ===== 组件 =====

export const KeyframeEditor: React.FC = () => {
  const tracks = useAppStore((s) => s.tracks);
  const currentFrame = useAppStore((s) => s.currentFrame);
  const selectedLayerIds = useAppStore((s) => s.selectedLayerIds);

  // 收集所有可见关键帧
  const allKeyframes = tracks.flatMap((t) =>
    t.clips.flatMap((c) =>
      c.keyframes.map((kf) => ({
        ...kf,
        clipId: c.id,
        trackId: t.id,
      })),
    ),
  );

  const handleAddKeyframe = useCallback(() => {
    // 在选中图层的当前帧添加位置关键帧
    if (selectedLayerIds.length === 0) return;

    const layerId = selectedLayerIds[0];
    const props = ['x', 'y', 'scaleX', 'scaleY', 'rotation', 'opacity'];

    // 查找对应的 Clip
    for (const track of tracks) {
      for (const clip of track.clips) {
        // TODO: 建立 layer→clip 映射
        for (const prop of props) {
          keyframeManager.addKeyframe(clip.id, prop, currentFrame, 0);
        }
      }
    }
  }, [currentFrame, selectedLayerIds, tracks]);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button
          className={styles.addBtn}
          onClick={handleAddKeyframe}
          disabled={selectedLayerIds.length === 0}
          title="在当前帧添加关键帧 (F6)"
        >
          ◆ 添加关键帧
        </button>
        <span className={styles.autoKeyframe}>
          <label>
            <input type="checkbox" />
            🔴 自动关键帧
          </label>
        </span>
        <span className={styles.hint}>
          {allKeyframes.length} 个关键帧
        </span>
      </div>

      {/* 关键帧列表 */}
      <div className={styles.list}>
        {allKeyframes.length === 0 ? (
          <div className={styles.empty}>
            选中图层后添加关键帧 (F6)
          </div>
        ) : (
          allKeyframes.map((kf) => (
            <div key={kf.id} className={styles.keyframeItem}>
              <span
                className={styles.propertyDot}
                style={{ backgroundColor: PROPERTY_COLORS[kf.property] ?? '#888' }}
              />
              <span className={styles.property}>{kf.property}</span>
              <span className={styles.frame}>帧 {kf.frame}</span>
              <span className={styles.value}>
                {typeof kf.value === 'number' ? kf.value.toFixed(1) : String(kf.value)}
              </span>
              <span className={styles.easing}>{kf.easing}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
