import { Form, Input, Modal, Typography } from 'antd'
import type { FormInstance } from 'antd'
import type { PurchaseOrder } from '../types'
import type {
  DeleteItemTarget,
  UpdateOrderFormValues
} from '../model/purchaseOrderViewTypes'

const { Text } = Typography

type EditDeleteModalsProps = {
  actionKey?: string
  editOrderTarget: PurchaseOrder | null
  editOrderForm: FormInstance<UpdateOrderFormValues>
  deleteTargetOrder: PurchaseOrder | null
  deleteTargetItem: DeleteItemTarget | null
  handleSaveOrderHeader: () => Promise<void>
  closeEditOrderModal: () => void
  handleDeleteOrder: () => Promise<void>
  handleDeleteItem: () => Promise<void>
  setDeleteTargetOrder: (order: PurchaseOrder | null) => void
  setDeleteTargetItem: (target: DeleteItemTarget | null) => void
}

export function PurchaseOrderEditDeleteModals({
  actionKey,
  editOrderTarget,
  editOrderForm,
  deleteTargetOrder,
  deleteTargetItem,
  handleSaveOrderHeader,
  closeEditOrderModal,
  handleDeleteOrder,
  handleDeleteItem,
  setDeleteTargetOrder,
  setDeleteTargetItem
}: EditDeleteModalsProps) {
  return (
    <>
      <Modal
        title="编辑采购单"
        open={Boolean(editOrderTarget)}
        okText="保存"
        cancelText="取消"
        okButtonProps={{ loading: actionKey === `edit-order:${editOrderTarget?.id}` }}
        onOk={() => void handleSaveOrderHeader()}
        onCancel={closeEditOrderModal}
        width={560}
      >
        <Form form={editOrderForm} layout="vertical" requiredMark={false}>
          <Form.Item
            label="采购单名"
            name="title"
            rules={[{ required: true, whitespace: true, message: '请输入采购单名' }]}
          >
            <Input placeholder="输入采购单名" maxLength={60} showCount />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea placeholder="输入备注" autoSize={{ minRows: 3, maxRows: 5 }} maxLength={160} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="删除采购单"
        open={Boolean(deleteTargetOrder)}
        okText="删除"
        okButtonProps={{ danger: true, loading: actionKey === `delete:${deleteTargetOrder?.id}` }}
        cancelText="取消"
        onOk={() => void handleDeleteOrder()}
        onCancel={() => setDeleteTargetOrder(null)}
      >
        <Text>确认删除 {deleteTargetOrder?.title || '该采购单'}？</Text>
      </Modal>

      <Modal
        title="删除商品"
        open={Boolean(deleteTargetItem)}
        okText="删除"
        okButtonProps={{ danger: true, loading: actionKey === `delete-item:${deleteTargetItem?.item.id}` }}
        cancelText="取消"
        onOk={() => void handleDeleteItem()}
        onCancel={() => setDeleteTargetItem(null)}
      >
        <Text>
          确认从 {deleteTargetItem?.order.title || '该采购单'} 删除 {deleteTargetItem?.item.partnerSku || '该商品'}？
        </Text>
      </Modal>
    </>
  )
}
