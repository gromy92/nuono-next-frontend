import { Space, Tag, Tooltip, Typography } from 'antd';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { useState } from 'react';

const { Text } = Typography;

export type ProductImageThumbProps = {
  src?: string | null;
  alt: string;
  imageCount?: number;
  width?: CSSProperties['width'];
  fit?: CSSProperties['objectFit'];
  fallback?: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
};

export function ProductImageThumb({
  src,
  alt,
  imageCount = 0,
  width = 96,
  fit = 'contain',
  fallback = '无图',
  onClick,
  disabled
}: ProductImageThumbProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const normalizedSrc = typeof src === 'string' ? src.trim() : '';
  const visibleSrc = normalizedSrc && failedSrc !== normalizedSrc ? normalizedSrc : undefined;
  const visibleImageCount = Math.max(visibleSrc ? 1 : 0, imageCount);
  const clickable = Boolean(onClick && visibleSrc && !disabled);
  const content = visibleSrc ? (
    <span style={{ position: 'relative', width: '100%', height: '100%', display: 'block' }}>
      <img
        src={visibleSrc}
        alt={alt}
        onError={() => setFailedSrc(visibleSrc)}
        style={{ width: '100%', height: '100%', objectFit: fit, display: 'block' }}
      />
      {visibleImageCount > 0 ? (
        <span
          style={{
            position: 'absolute',
            right: 4,
            bottom: 4,
            padding: '1px 5px',
            borderRadius: 4,
            color: '#ffffff',
            background: 'rgba(15, 23, 42, 0.72)',
            fontSize: 11,
            lineHeight: '16px'
          }}
        >
          {visibleImageCount}
        </span>
      ) : null}
    </span>
  ) : (
    <span
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: 11,
        background: '#f8fafc'
      }}
    >
      {fallback}
    </span>
  );

  if (!onClick) {
    return (
      <span
        style={{
          display: 'inline-flex',
          width,
          aspectRatio: '4 / 3',
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          background: '#ffffff'
        }}
      >
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      aria-label={visibleImageCount > 0 ? `查看商品图片，共 ${visibleImageCount} 张` : '查看商品图片'}
      style={{
        width,
        aspectRatio: '4 / 3',
        padding: 0,
        borderRadius: 6,
        border: '1px solid #e5e7eb',
        background: '#ffffff',
        overflow: 'hidden',
        cursor: clickable ? 'pointer' : 'default'
      }}
    >
      {content}
    </button>
  );
}

export type ProductBaselineCode = {
  label?: string;
  value?: ReactNode;
  copyText?: string;
};

export type ProductBaselineIdentityProps = {
  title?: ReactNode;
  fallbackTitle?: ReactNode;
  imageUrl?: string | null;
  imageCount?: number;
  imageAlt?: string;
  imageWidth?: CSSProperties['width'];
  imageDisabled?: boolean;
  showImage?: boolean;
  onImageClick?: () => void;
  codes?: ProductBaselineCode[];
  tags?: ReactNode;
  extra?: ReactNode;
  titleMaxWidth?: CSSProperties['maxWidth'];
  compact?: boolean;
};

export function ProductBaselineIdentity({
  title,
  fallbackTitle = '-',
  imageUrl,
  imageCount,
  imageAlt,
  imageWidth = 72,
  imageDisabled,
  showImage = true,
  onImageClick,
  codes = [],
  tags,
  extra,
  titleMaxWidth = '100%',
  compact = false
}: ProductBaselineIdentityProps) {
  const visibleTitle = title || fallbackTitle;
  const visibleImageAlt = imageAlt || (typeof visibleTitle === 'string' ? visibleTitle : '商品图片');
  const visibleCodes = codes.filter((item) => item.value !== undefined && item.value !== null && item.value !== '');

  return (
    <div style={{ display: 'flex', gap: compact ? 8 : 10, alignItems: 'flex-start', minWidth: 0 }}>
      {showImage ? (
        <ProductImageThumb
          src={imageUrl}
          alt={visibleImageAlt}
          imageCount={imageCount}
          width={imageWidth}
          disabled={imageDisabled}
          onClick={
            onImageClick
              ? (event) => {
                event.stopPropagation();
                onImageClick();
              }
              : undefined
          }
        />
      ) : null}
      <Space direction="vertical" size={compact ? 2 : 4} style={{ minWidth: 0, flex: '1 1 auto' }}>
        <Tooltip title={typeof visibleTitle === 'string' ? visibleTitle : undefined}>
          <Text
            strong
            ellipsis
            style={{ maxWidth: titleMaxWidth, fontSize: compact ? 12 : 14, lineHeight: compact ? '18px' : '20px' }}
          >
            {visibleTitle}
          </Text>
        </Tooltip>
        {visibleCodes.length ? (
          <Space size={[6, 2]} wrap>
            {visibleCodes.map((code, index) => {
              return (
                <Text
                  key={`${code.label || 'code'}-${code.copyText || index}`}
                  type="secondary"
                  copyable={code.copyText ? { text: code.copyText } : false}
                  style={{ fontSize: compact ? 11 : 12, lineHeight: compact ? '16px' : '18px' }}
                >
                  {code.label ? (
                    <>
                      {code.label} {code.value}
                    </>
                  ) : (
                    code.value
                  )}
                </Text>
              );
            })}
          </Space>
        ) : null}
        {tags ? <Space size={[4, 4]} wrap>{tags}</Space> : null}
        {extra}
      </Space>
    </div>
  );
}

export function ProductDimensionOptionLabel({
  label,
  value,
  usageCount
}: {
  label?: string | null;
  value: string;
  usageCount?: number | null;
}) {
  const visibleLabel = label || value;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0, maxWidth: '100%' }}>
      <Text ellipsis style={{ maxWidth: 280 }}>
        {visibleLabel}
      </Text>
      {label && label !== value ? (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {value}
        </Text>
      ) : null}
      {typeof usageCount === 'number' ? (
        <Tag style={{ marginInlineEnd: 0, fontSize: 11 }}>{usageCount}</Tag>
      ) : null}
    </span>
  );
}
