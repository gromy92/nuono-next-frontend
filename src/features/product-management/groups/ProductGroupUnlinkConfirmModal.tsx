import { Modal, Space, Typography } from 'antd';
import { formatSnapshotValue } from '../utils';
import { ProductBaselineIdentity } from '../../product-baseline';
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
              padding: 14,
              border: '1px solid var(--pm-subtle-border)',
              borderRadius: 8,
              background: 'var(--pm-subtle-bg)'
            }}
          >
            <ProductBaselineIdentity
              title={member.title || member.skuParent}
              imageUrl={imageUrl}
              imageCount={imageCount}
              imageAlt={member.title || member.skuParent}
              imageWidth={88}
              titleMaxWidth={360}
              codes={[
                {
                  label: 'SKU',
                  value: formatSnapshotValue(member.childSku || member.skuParent),
                  copyText: member.childSku || member.skuParent
                },
                {
                  label: 'Group',
                  value: safeGroupName
                }
              ]}
            />
          </div>
        ) : null}
        <Text type="secondary">确认移除该商品的 Group 关联？确认后会形成待发布修改。</Text>
      </Space>
    </Modal>
  );
}
