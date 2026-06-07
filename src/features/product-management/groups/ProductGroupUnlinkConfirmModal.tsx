import { Modal, Space, Typography } from 'antd';
import { formatSnapshotValue } from '../utils';
import { ProductImageThumb } from '../components/ProductBaselineDisplay';
import type { ProductGroupMemberCardView } from './productGroupMemberTypes';

const { Text } = Typography;

type ProductGroupUnlinkConfirmModalProps = {
  groupName: string;
  member: ProductGroupMemberCardView | null;
  open: boolean;
  confirmDisabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ProductGroupUnlinkConfirmModal(props: ProductGroupUnlinkConfirmModalProps) {
  const { groupName, member, open, confirmDisabled = false, onCancel, onConfirm } = props;
  const safeGroupName = formatSnapshotValue(groupName);
  const imageUrl = member?.imageUrl || member?.galleryImages?.[0];
  const imageCount = member?.galleryImages?.length ?? (imageUrl ? 1 : 0);

  return (
    <Modal
      title="移除关联"
      open={open}
      width={560}
      okText="确认移除"
      cancelText="取消"
      okButtonProps={{ disabled: confirmDisabled }}
      onCancel={onCancel}
      onOk={onConfirm}
      destroyOnClose
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {member ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '88px minmax(0, 1fr)',
              gap: 12,
              alignItems: 'center',
              padding: 14,
              border: '1px solid var(--pm-subtle-border)',
              borderRadius: 8,
              background: 'var(--pm-subtle-bg)'
            }}
          >
            <ProductImageThumb
              src={imageUrl}
              alt={member.title || member.skuParent}
              imageCount={imageCount}
              width={88}
            />
            <Space direction="vertical" size={6} style={{ minWidth: 0 }}>
              <Text strong ellipsis={{ tooltip: member.title || member.skuParent }}>
                {formatSnapshotValue(member.title || member.skuParent)}
              </Text>
              <Text type="secondary">Group：{safeGroupName}</Text>
              <Text type="secondary">SKU：{formatSnapshotValue(member.childSku || member.skuParent)}</Text>
            </Space>
          </div>
        ) : null}
        <Text type="secondary">确认移除该商品的 Group 关联？确认后会形成待发布修改。</Text>
      </Space>
    </Modal>
  );
}
