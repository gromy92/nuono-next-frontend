import { Modal, Space, Typography } from 'antd';
import type { ProductManagementWorkspace } from '../workspaceTypes';
import { formatSnapshotValue } from '../utils';
import { ProductVariantSpecTable } from './ProductVariantSpecTable';

const { Text } = Typography;

type ProductVariantSpecModalProps = {
  workspace: ProductManagementWorkspace;
};

export function ProductVariantSpecModal({ workspace }: ProductVariantSpecModalProps) {
  const {
    productVariantSpecModalState,
    setProductVariantSpecModalState
  } = workspace;
  const {
    open,
    ownerUserId,
    storeCode,
    skuParent,
    title,
    partnerSku,
    imageUrl
  } = productVariantSpecModalState;

  const closeModal = () => {
    setProductVariantSpecModalState({ open: false });
  };

  return (
    <Modal
      open={open}
      title="商品规格"
      footer={null}
      onCancel={closeModal}
      width={1180}
      centered
      destroyOnClose
      styles={{ body: { paddingTop: 8 } }}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            padding: '8px 10px',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            background: '#f8fafc'
          }}
        >
          <span
            style={{
              flex: '0 0 42px',
              width: 42,
              height: 42,
              borderRadius: 5,
              overflow: 'hidden',
              background: '#f1f5f9',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title || skuParent || '商品'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              '无图'
            )}
          </span>
          <div style={{ minWidth: 0 }}>
            <Text
              strong
              style={{
                display: 'block',
                maxWidth: 860,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: '#0f172a',
                fontSize: 14,
                lineHeight: '20px'
              }}
            >
              {formatSnapshotValue(title || skuParent)}
            </Text>
            <Text type="secondary" style={{ fontSize: 12, lineHeight: '18px' }}>
              SKU {formatSnapshotValue(skuParent)} · PSKU {formatSnapshotValue(partnerSku)} · 店铺 {formatSnapshotValue(storeCode)}
            </Text>
          </div>
        </div>
        <ProductVariantSpecTable scope={{ ownerUserId, storeCode, skuParent }} />
      </Space>
    </Modal>
  );
}
