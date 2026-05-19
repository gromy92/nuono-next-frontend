import type { ReactNode } from 'react';
import { Space, Tag, Typography } from 'antd';
import type { ProductFieldDomainSurface } from '../types';
import { productFieldDomainStatusMeta } from '../utils';

const { Text } = Typography;

export function ProductFieldDomainSectionHeader(props: {
  title: string;
  domain?: ProductFieldDomainSurface;
  extra?: ReactNode;
}) {
  const { title, domain, extra } = props;
  const statusMeta = domain ? productFieldDomainStatusMeta(domain.status) : null;

  return (
    <Space wrap size={[8, 8]} style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
      <Space wrap size={[8, 8]}>
        <Text strong>{title}</Text>
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
    </Space>
  );
}
