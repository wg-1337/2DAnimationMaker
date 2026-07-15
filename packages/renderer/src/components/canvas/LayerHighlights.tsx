// 选中图层可视化 — 选择框 + 变换手柄
import React from 'react';
import { useAppStore } from '../../stores/appStore';
import type { Layer, Transform } from '@animation-maker/shared';

/** 单图层高亮框 */
const LayerBox: React.FC<{ layer: Layer }> = ({ layer }) => {
  const t = layer.transform;
  const shapeData = layer.content.shapeData;
  const w = shapeData?.width ?? 100;
  const h = shapeData?.height ?? 100;

  return (
    <div
      style={{
        position: 'absolute',
        left: t.x - w / 2,
        top: t.y - h / 2,
        width: w,
        height: h,
        border: `2px solid var(--accent-primary)`,
        borderRadius: 2,
        pointerEvents: 'none',
      }}
    >
      {/* 8 个缩放手柄 */}
      {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((pos) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          width: 8,
          height: 8,
          background: 'var(--accent-primary)',
          border: '1px solid #fff',
          pointerEvents: 'auto',
          cursor: `${pos}-resize`,
        };
        if (pos.includes('n')) style.top = -4;
        if (pos.includes('s')) style.bottom = -4;
        if (pos.includes('w')) style.left = -4;
        if (pos.includes('e')) style.right = -4;
        if (pos === 'n' || pos === 's') style.left = 'calc(50% - 4px)';
        if (pos === 'e' || pos === 'w') style.top = 'calc(50% - 4px)';
        return <div key={pos} style={style} />;
      })}

      {/* 旋转手柄 */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          left: 'calc(50% - 4px)',
          width: 8,
          height: 8,
          background: 'var(--accent-primary)',
          borderRadius: '50%',
          border: '1px solid #fff',
          pointerEvents: 'auto',
          cursor: 'grab',
        }}
      />
    </div>
  );
};

/** 所有选中图层的高亮 */
export const LayerHighlights: React.FC = () => {
  const selectedIds = useAppStore((s) => s.selectedLayerIds);
  const layers = useAppStore((s) => s.layers);
  const selected = layers.filter((l) => selectedIds.includes(l.id));

  return (
    <>
      {selected.map((layer) => (
        <LayerBox key={layer.id} layer={layer} />
      ))}
    </>
  );
};
