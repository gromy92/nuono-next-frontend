import { Alert, Modal, Typography } from 'antd'

const { Paragraph, Text } = Typography

type Ali1688AuthorizationModalProps = {
  open: boolean
  submitting: boolean
  errorMessage?: string
  onCancel: () => void
  onConfirm: () => void
}

export function Ali1688AuthorizationModal({
  open,
  submitting,
  errorMessage,
  onCancel,
  onConfirm
}: Ali1688AuthorizationModalProps) {
  return (
    <Modal
      title="授权 1688"
      open={open}
      okText="确认授权"
      cancelText="取消"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={onConfirm}
      destroyOnClose
    >
      <div className="ali1688-authorization-modal-body">
        {errorMessage ? (
          <Alert
            type="warning"
            showIcon
            message={errorMessage}
            style={{ marginBottom: 16 }}
          />
        ) : null}
        <Paragraph>
          系统将读取 1688 历史订单，用于同步订单、商品行、供应商和物流摘要。
        </Paragraph>
        <Paragraph>
          <Text strong>不会付款</Text>，也<Text strong>不会创建订单</Text>，不会发起询盘或售后操作。
        </Paragraph>
      </div>
    </Modal>
  )
}
