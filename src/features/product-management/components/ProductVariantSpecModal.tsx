import { App as AntdApp, Modal, Space } from 'antd';
import type { ProductManagementWorkspace } from '../workspaceTypes';
import { formatSnapshotValue } from '../utils';
import { ProductVariantSpecTable } from './ProductVariantSpecTable';
import { ProductBaselineIdentity } from '../../product-baseline';

type ProductVariantSpecModalProps = {
  workspace: ProductManagementWorkspace;
};

export function ProductVariantSpecModal({ workspace }: ProductVariantSpecModalProps) {
  const { message: messageApi } = AntdApp.useApp();
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

  const handleSaved = () => {
    messageApi.success('保存成功');
    workspace.refreshProductWorkspaceSurface();
    window.setTimeout(closeModal, 0);
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
            padding: '8px 10px',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            background: '#f8fafc'
          }}
        >
          <ProductBaselineIdentity
            title={title || skuParent || '商品'}
            imageUrl={imageUrl}
            imageCount={imageUrl ? 1 : 0}
            imageAlt={title || skuParent || '商品'}
            imageWidth={56}
            compact
            titleMaxWidth={860}
            codes={[
              {
                label: 'SKU',
                value: formatSnapshotValue(skuParent),
                copyText: skuParent
              },
              {
                label: 'PSKU',
                value: formatSnapshotValue(partnerSku),
                copyText: partnerSku
              },
              {
                label: '店铺',
                value: formatSnapshotValue(storeCode)
              }
            ]}
          />
        </div>
        <ProductVariantSpecTable scope={{ ownerUserId, storeCode, skuParent }} onSaved={handleSaved} />
      </Space>
    </Modal>
  );
}
