import { Space, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  aggregateFbnStock,
  formatSnapshotValue,
  isLiveStatusActive,
  productLiveStatusLabel,
  siteOfferCode
} from '../utils';

const { Text } = Typography;

const compactTagStyle = {
  marginInlineEnd: 0,
  fontSize: 12,
  lineHeight: '20px',
  paddingInline: 7
};

const cellTextStyle = {
  color: '#111827',
  fontSize: 13,
  lineHeight: '20px'
};

const mutedCellTextStyle = {
  color: '#64748b',
  fontSize: 13,
  lineHeight: '20px'
};

function columnTitle(label: string) {
  return <Text style={{ color: '#111827', fontSize: 13, fontWeight: 600 }}>{label}</Text>;
}

export function createProductSiteCompareColumns(params: {
  dirtySiteOfferCodes: string[];
}): ColumnsType<Record<string, unknown>> {
  const { dirtySiteOfferCodes } = params;

  return [
    {
      title: columnTitle('站点'),
      key: 'site',
      width: 90,
      render: (_: unknown, record) => {
        const currentCode = siteOfferCode(record);
        return (
          <Space wrap size={[5, 5]}>
            <Tag color="processing" style={compactTagStyle}>
              {formatSnapshotValue(record.site)}
            </Tag>
            {dirtySiteOfferCodes.includes(currentCode) ? (
              <Tag color="processing" style={compactTagStyle}>
                本地草稿
              </Tag>
            ) : null}
          </Space>
        );
      }
    },
    {
      title: columnTitle('价格'),
      key: 'pricing',
      width: 128,
      render: (_: unknown, record) => (
        <Space direction="vertical" size={2}>
          <Text style={cellTextStyle}>原价 {formatSnapshotValue(record.price)}</Text>
          <Text style={mutedCellTextStyle}>促销价 {formatSnapshotValue(record.salePrice)}</Text>
        </Space>
      )
    },
    {
      title: columnTitle('库存'),
      key: 'stock',
      width: 166,
      render: (_: unknown, record) => (
        <Space direction="vertical" size={2}>
          <Text style={cellTextStyle}>
            FBN {formatSnapshotValue(aggregateFbnStock(record))}
            {` (Supermall ${formatSnapshotValue(record.supermallStock ?? 0)})`}
          </Text>
          <Text style={mutedCellTextStyle}>FBP {formatSnapshotValue(record.fbpStock ?? 0)}</Text>
        </Space>
      )
    },
    {
      title: columnTitle('经营状态'),
      key: 'status',
      width: 210,
      render: (_: unknown, record) => (
        <Space wrap size={[5, 5]}>
          <Tag color={Boolean(record.isActive) ? 'success' : 'default'} style={compactTagStyle}>
            {Boolean(record.isActive) ? '运营启用' : '运营停用'}
          </Tag>
          <Tag color={isLiveStatusActive(record.liveStatus) ? 'success' : 'default'} style={compactTagStyle}>
            {productLiveStatusLabel(record.liveStatus)}
          </Tag>
        </Space>
      )
    },
    {
      title: columnTitle('发布状态'),
      key: 'publishStatus',
      width: 142,
      render: (_: unknown, record) =>
        dirtySiteOfferCodes.includes(siteOfferCode(record)) ? (
          <Text style={{ ...cellTextStyle, color: '#1677ff' }}>站点字段已改</Text>
        ) : (
          <Text style={cellTextStyle}>已跟随当前基线</Text>
        )
    }
  ];
}
