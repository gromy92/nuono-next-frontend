import { Space, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { aggregateFbnStock, formatSnapshotValue, isLiveStatusActive, productLiveStatusLabel, siteOfferCode } from '../utils';

export function createSiteOfferColumns(params: {
  dirtySiteOfferCodes: string[];
  activeSiteOfferCode?: string;
}): ColumnsType<Record<string, unknown>> {
  const { dirtySiteOfferCodes, activeSiteOfferCode } = params;

  return [
    {
      title: '站点',
      key: 'site',
      width: 180,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space wrap size={[6, 6]}>
          <Tag color="processing" style={{ marginInlineEnd: 0 }}>
            {formatSnapshotValue(record.site)}
          </Tag>
          {dirtySiteOfferCodes.includes(siteOfferCode(record)) ? (
            <Tag color="processing" style={{ marginInlineEnd: 0 }}>
              本地草稿
            </Tag>
          ) : null}
          {record.reference ? (
            <Tag color="success" style={{ marginInlineEnd: 0 }}>
              参考站点
            </Tag>
          ) : null}
          {siteOfferCode(record) === activeSiteOfferCode ? (
            <Tag color="default" style={{ marginInlineEnd: 0 }}>
              当前编辑
            </Tag>
          ) : null}
        </Space>
      )
    },
    {
      title: 'StoreCode',
      dataIndex: 'storeCode',
      key: 'storeCode',
      width: 180,
      render: (value: unknown) => formatSnapshotValue(value)
    },
    {
      title: '价格',
      key: 'pricing',
      width: 220,
      render: (_: unknown, record: Record<string, unknown>) => (
        <div>
          <div>原价 {formatSnapshotValue(record.price)}</div>
          <div style={{ color: '#64748b', marginTop: 4 }}>促销价 {formatSnapshotValue(record.salePrice)}</div>
        </div>
      )
    },
    {
      title: '库存',
      key: 'stock',
      width: 220,
      render: (_: unknown, record: Record<string, unknown>) => (
        <div>
          <div>
            FBN {formatSnapshotValue(aggregateFbnStock(record))}
            {` (Supermall ${formatSnapshotValue(record.supermallStock ?? 0)})`}
          </div>
          <div style={{ color: '#64748b', marginTop: 4 }}>FBP {formatSnapshotValue(record.fbpStock)}</div>
        </div>
      )
    },
    {
      title: '经营状态',
      key: 'status',
      width: 220,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space wrap size={[6, 6]}>
          <Tag color={Boolean(record.isActive) ? 'success' : 'default'} style={{ marginInlineEnd: 0 }}>
            {Boolean(record.isActive) ? '运营启用' : '运营停用'}
          </Tag>
          <Tag color={isLiveStatusActive(record.liveStatus) ? 'success' : 'default'} style={{ marginInlineEnd: 0 }}>
            {productLiveStatusLabel(record.liveStatus)}
          </Tag>
          {record.statusCode ? (
            <Tag color="default" style={{ marginInlineEnd: 0 }}>
              {formatSnapshotValue(record.statusCode)}
            </Tag>
          ) : null}
        </Space>
      )
    },
    {
      title: '发布状态',
      key: 'readyToPublish',
      width: 180,
      render: (_: unknown, record: Record<string, unknown>) =>
        dirtySiteOfferCodes.includes(siteOfferCode(record)) ? '站点字段已改' : '已跟随当前基线'
    }
  ];
}
