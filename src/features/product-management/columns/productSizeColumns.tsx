import { Button, Input, Space, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ProductMasterSnapshotPayload } from '../types';
import { formatSnapshotValue, textInputValue } from '../utils';

const { Text } = Typography;

export function createProductSizeColumns(params: {
  productSnapshotView?: ProductMasterSnapshotPayload;
  updateProductVariant: (index: number, field: 'childSku' | 'sizeEn' | 'sizeAr', value: string) => void;
  removeProductVariant: (index: number) => void;
}): ColumnsType<Record<string, unknown>> {
  const { productSnapshotView, updateProductVariant, removeProductVariant } = params;

  return [
    {
      title: 'Partner SKU *',
      key: 'partnerSku',
      width: 260,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Input
            disabled
            value={
              textInputValue(record.partnerSku) ||
              textInputValue(productSnapshotView?.identity.partnerSku) ||
              textInputValue(record.childSku)
            }
          />
          <Text style={{ color: '#94a3b8', fontSize: 12 }}>
            SKU {formatSnapshotValue(record.childSku ?? productSnapshotView?.identity.childSku)}
          </Text>
        </Space>
      )
    },
    {
      title: 'Seller Size (EN) *',
      dataIndex: 'sizeEn',
      key: 'sizeEn',
      width: 220,
      render: (value: unknown, _record: Record<string, unknown>, index: number) => (
        <Input
          value={textInputValue(value)}
          placeholder="--"
          onChange={(event) => updateProductVariant(index, 'sizeEn', event.target.value)}
        />
      )
    },
    {
      title: 'Seller Size (AR) *',
      dataIndex: 'sizeAr',
      key: 'sizeAr',
      width: 220,
      render: (value: unknown, _record: Record<string, unknown>, index: number) => (
        <Input
          value={textInputValue(value)}
          placeholder="--"
          onChange={(event) => updateProductVariant(index, 'sizeAr', event.target.value)}
        />
      )
    },
    {
      title: 'Display Size',
      key: 'displaySize',
      width: 180,
      render: (_: unknown, record: Record<string, unknown>) =>
        textInputValue(record.displaySize) || textInputValue(record.sizeEn) || textInputValue(record.sizeAr) || '--'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, _record: Record<string, unknown>, index: number) => (
        <Button
          type="link"
          danger
          disabled
          style={{ paddingInline: 0 }}
          onClick={() => removeProductVariant(index)}
        >
          Delete
        </Button>
      )
    }
  ];
}
