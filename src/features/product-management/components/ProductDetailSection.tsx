import type { ReactNode } from 'react';
import { Space, Tag, Typography } from 'antd';
import type { ProductFieldDomainSurface } from '../types';
import { productFieldDomainStatusMeta } from '../utils';

const { Text } = Typography;

type ProductDetailSectionVariant = 'panel' | 'subtle';

type ProductDetailSectionProps = {
  title?: ReactNode;
  domain?: ProductFieldDomainSurface;
  extra?: ReactNode;
  variant?: ProductDetailSectionVariant;
  fullHeight?: boolean;
  className?: string;
  children: ReactNode;
};

export function ProductDetailSection({
  title,
  domain,
  extra,
  variant = 'panel',
  fullHeight = false,
  className,
  children
}: ProductDetailSectionProps) {
  const statusMeta = domain ? productFieldDomainStatusMeta(domain.status) : null;
  const classes = [
    'pm-detail-section',
    variant === 'subtle' ? 'pm-detail-section--subtle' : null,
    fullHeight ? 'pm-detail-section--full-height' : null,
    className
  ]
    .filter(Boolean)
    .join(' ');

  const showHeader = title || extra || statusMeta || domain?.scopeLabel;

  return (
    <div className={classes}>
      {showHeader ? (
        <div className="pm-detail-section-header">
          <Space wrap size={[8, 8]}>
            {typeof title === 'string' ? (
              <Text strong style={{ color: 'var(--pm-text-primary)' }}>
                {title}
              </Text>
            ) : (
              title
            )}
            {statusMeta ? (
              <Tag color={statusMeta.color} style={{ marginInlineEnd: 0 }}>
                {statusMeta.label}
              </Tag>
            ) : null}
            {domain?.scopeLabel ? (
              <Tag color="default" style={{ marginInlineEnd: 0 }}>
                {domain.scopeLabel}
              </Tag>
            ) : null}
          </Space>
          {extra}
        </div>
      ) : null}
      {children}
    </div>
  );
}
