// 文字内联编辑器 — 双击文字图层后显示输入框
import React, { useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '../../stores/appStore';

export const TextEditor: React.FC = () => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const selectedLayerIds = useAppStore((s) => s.selectedLayerIds);
  const layers = useAppStore((s) => s.layers);

  const selectedLayer = layers.find((l) => selectedLayerIds.includes(l.id));
  if (!selectedLayer || selectedLayer.type !== 'text') return null;

  const textData = selectedLayer.content.textData;
  if (!textData) return null;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      useAppStore.setState((s) => ({
        layers: s.layers.map((l) =>
          l.id === selectedLayer.id
            ? {
                ...l,
                content: {
                  ...l.content,
                  textData: { ...l.content.textData!, text: newText },
                },
              }
            : l,
        ),
      }));
    },
    [selectedLayer.id],
  );

  // 自动聚焦
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const t = selectedLayer.transform;
  const opts = useAppStore.getState().toolOptions;

  return (
    <div
      style={{
        position: 'absolute',
        left: t.x,
        top: t.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 100,
      }}
    >
      <textarea
        ref={inputRef}
        value={textData.text}
        onChange={handleChange}
        rows={3}
        style={{
          background: 'rgba(0,0,0,0.7)',
          color: opts.fillColor,
          border: `1px dashed ${opts.fillColor}`,
          borderRadius: 4,
          padding: 8,
          fontSize: textData.fontSize,
          fontFamily: textData.fontFamily,
          minWidth: 200,
          minHeight: 60,
          resize: 'both',
          outline: 'none',
          textAlign: textData.textAlign as 'left' | 'center' | 'right',
        }}
      />
    </div>
  );
};
