import { Form, Input, Modal } from 'antd';
import type { WarehouseShippingOrderData } from './useWarehouseShippingOrderData';

export function WarehouseShippingOrderEditModal({ data }: { data: WarehouseShippingOrderData }) {
  return (
    <Modal
      title="修改仓库单名"
      open={Boolean(data.editTarget)}
      okText="保存"
      cancelText="取消"
      okButtonProps={{ loading: data.actionKey === `update-shipping-order:${data.editTarget?.id}` }}
      onOk={() => void data.handleUpdateTitle()}
      onCancel={data.closeEditModal}
      width={520}
    >
      <div className="warehouse-shipping-order-edit-form">
        <Form.Item label="仓库单名" required>
          <Input
            value={data.editTitle}
            onChange={(event) => data.setEditTitle(event.target.value)}
            maxLength={80}
            showCount
            placeholder="输入仓库单名"
          />
        </Form.Item>
        <Form.Item label="备注">
          <Input.TextArea
            value={data.editRemark}
            onChange={(event) => data.setEditRemark(event.target.value)}
            maxLength={160}
            showCount
            autoSize={{ minRows: 3, maxRows: 5 }}
            placeholder="输入备注"
          />
        </Form.Item>
      </div>
    </Modal>
  );
}
