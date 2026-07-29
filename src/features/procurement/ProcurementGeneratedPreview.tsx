import { Space } from 'antd';
import type { ProcurementPreviewFrame } from './types';
import { procurementPreviewPalette } from './procurementPreviewIllustration';

export function ProcurementGeneratedPreviewCard({
  frame,
  sectionLabel,
  minHeight = 280
}: {
  frame: ProcurementPreviewFrame;
  sectionLabel: string;
  minHeight?: number;
}) {
  const palette = procurementPreviewPalette(`${sectionLabel}-${frame.key}-${frame.title}`);

  return (
    <div
      style={{
        minHeight,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: palette.background
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 10px',
            borderRadius: 999,
            background: palette.chipBackground,
            color: palette.secondary,
            fontSize: 12,
            fontWeight: 600
          }}
        >
          {frame.label}
        </span>
        <span style={{ color: palette.secondary, fontSize: 12, fontWeight: 600 }}>{sectionLabel}</span>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ color: palette.heading, fontSize: 24, fontWeight: 700, lineHeight: 1.35 }}>
          {frame.title}
        </div>
        <div style={{ marginTop: 10, color: palette.secondary, fontSize: 13, lineHeight: 1.6 }}>
          {frame.subtitle || '待补充更多图片线索'}
        </div>
      </div>

      <Space wrap size={[8, 8]} style={{ marginTop: 16 }}>
        {frame.highlights.slice(0, 3).map((item) => (
          <span
            key={`${frame.key}-${item}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 10px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.82)',
              color: '#334155',
              fontSize: 12
            }}
          >
            {item}
          </span>
        ))}
      </Space>
    </div>
  );
}

export function ProcurementGeneratedThumb({
  frame,
  sectionLabel,
  width,
  height
}: {
  frame: ProcurementPreviewFrame;
  sectionLabel: string;
  width: number;
  height: number;
}) {
  const palette = procurementPreviewPalette(`${sectionLabel}-${frame.key}-${frame.title}-thumb`);

  return (
    <div
      style={{
        width,
        height,
        padding: 10,
        borderRadius: 14,
        border: '1px solid #dbe4ea',
        background: `linear-gradient(135deg, ${palette.background}, #ffffff)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <span
        style={{
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          padding: '2px 8px',
          borderRadius: 999,
          background: palette.chipBackground,
          color: palette.secondary,
          fontSize: 11,
          fontWeight: 600
        }}
      >
        {frame.label}
      </span>
      <div>
        <div
          style={{
            color: palette.heading,
            fontSize: width <= 88 ? 11 : 12,
            lineHeight: 1.45,
            fontWeight: 700,
            display: '-webkit-box',
            WebkitLineClamp: width <= 88 ? 3 : 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {frame.title}
        </div>
        <div style={{ marginTop: 6, color: '#64748b', fontSize: 11 }}>
          {frame.highlights[0] || '真实商品图待接入'}
        </div>
      </div>
    </div>
  );
}
