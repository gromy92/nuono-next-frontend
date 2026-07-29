import { useEffect, useState } from 'react'
import { normalizeNoonImageUrl } from '../../product-baseline'

export function ProductThumb({ src, alt, variantId }: { src?: string; alt: string; variantId?: number }) {
  const normalizedSrc = normalizeNoonImageUrl(src);
  const [failed, setFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setFailed(false);
    setPreviewOpen(false);
  }, [normalizedSrc]);

  if (!normalizedSrc || failed) {
    return (
      <span
        data-testid={variantId ? `product-spec-thumb-${variantId}` : undefined}
        style={{
          flex: '0 0 auto',
          width: 70,
          height: 90,
          borderRadius: 6,
          border: '1px solid #e5e7eb',
          background: '#f3f4f6',
          color: '#94a3b8',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11
        }}
      >
        无图
      </span>
    );
  }
  return (
    <span
      data-testid={variantId ? `product-spec-thumb-${variantId}` : undefined}
      onMouseEnter={() => setPreviewOpen(true)}
      onMouseLeave={() => setPreviewOpen(false)}
      style={{
        flex: '0 0 auto',
        width: 70,
        height: 90,
        position: 'relative',
        display: 'block'
      }}
    >
      <img
        src={normalizedSrc}
        alt={alt}
        onError={() => setFailed(true)}
        style={{
          width: 70,
          height: 90,
          objectFit: 'cover',
          borderRadius: 6,
          border: '1px solid #e5e7eb',
          background: '#f1f5f9',
          display: 'block'
        }}
      />
      {previewOpen ? (
        <span
          style={{
            position: 'absolute',
            left: 78,
            top: -8,
            zIndex: 20,
            width: 180,
            height: 180,
            padding: 6,
            borderRadius: 8,
            border: '1px solid #dbe3ef',
            background: '#ffffff',
            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.2)'
          }}
        >
          <img
            src={normalizedSrc}
            alt={alt}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block'
            }}
          />
        </span>
      ) : null}
    </span>
  );
}
