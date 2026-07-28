import { type ReactNode } from 'react';
import { Button, Space, Tag, Typography } from 'antd';
import type { ProcurementPreviewFrame } from './types';
import {
  procurementImageModeMeta,
  procurementPlatformLabel,
  procurementSourcePlatformColor
} from './domain';
import { ProcurementGeneratedPreviewCard } from './ProcurementGeneratedPreview';
import { procurementPreviewPalette } from './procurementPreviewIllustration';

const { Text } = Typography;

export function ProcurementPreviewPanel({
  sectionLabel,
  roleLabel,
  platform,
  frames,
  activeKey,
  onChange,
  extraTag
}: {
  sectionLabel: string;
  roleLabel: string;
  platform?: string;
  frames: ProcurementPreviewFrame[];
  activeKey: string;
  onChange: (nextKey: string) => void;
  extraTag?: ReactNode;
}) {
  const activeFrame = frames.find((item) => item.key === activeKey) ?? frames[0];

  if (!activeFrame) {
    return null;
  }

  const palette = procurementPreviewPalette(`${sectionLabel}-${activeFrame.key}-${activeFrame.title}`);
  const imageModeMeta = procurementImageModeMeta(activeFrame.imageMode);

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 12,
        border: '1px solid #dbe4ea',
        background: '#f8fafc',
        height: '100%'
      }}
    >
      <Space wrap size={[8, 8]} style={{ marginBottom: 10 }}>
        {platform ? (
          <Tag color={procurementSourcePlatformColor(platform)} style={{ marginInlineEnd: 0 }}>
            {procurementPlatformLabel(platform)}
          </Tag>
        ) : null}
        <Tag color="default" style={{ marginInlineEnd: 0 }}>
          {roleLabel}
        </Tag>
        {extraTag}
      </Space>

      <div
        style={{
          position: 'relative',
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${palette.border}`,
          background: '#ffffff'
        }}
      >
        <Tag
          color={imageModeMeta.color}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1,
            marginInlineEnd: 0,
            boxShadow: '0 6px 16px rgba(15, 23, 42, 0.12)'
          }}
	        >
	          {imageModeMeta.label}
	        </Tag>
	        {activeFrame.imageMode === 'real' && activeFrame.imageUrl ? (
	          <img
	            src={activeFrame.imageUrl}
	            alt={activeFrame.title}
	            style={{ display: 'block', width: '100%', height: 280, objectFit: 'cover', background: '#f8fafc' }}
	          />
	        ) : (
            <ProcurementGeneratedPreviewCard frame={activeFrame} sectionLabel={sectionLabel} minHeight={280} />
	        )}
	      </div>

      <div style={{ marginTop: 10 }}>
        <Text strong style={{ display: 'block', color: '#0f172a', marginBottom: 4 }}>
          {activeFrame.title}
        </Text>
        <Text style={{ color: '#64748b' }}>
          {activeFrame.note || activeFrame.subtitle || '当前图片视角可继续补充。'} · {imageModeMeta.note}
        </Text>
      </div>

      {frames.length > 1 ? (
        <Space wrap size={[8, 8]} style={{ marginTop: 12 }}>
          {frames.map((frame) => (
            <Button
              key={frame.key}
              size="small"
              type={frame.key === activeKey ? 'primary' : 'default'}
              ghost={frame.key === activeKey}
              onClick={() => onChange(frame.key)}
            >
              {frame.label}
            </Button>
          ))}
        </Space>
      ) : null}
    </div>
  );
}
