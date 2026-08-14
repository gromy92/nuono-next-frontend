import { Alert, Form, Input, Modal, Typography } from 'antd'

import type { Ali1688EnterpriseSelfUseTokenRequest } from '../types'

const { Paragraph, Text } = Typography

type Ali1688AuthorizationModalProps = {
  open: boolean
  submitting: boolean
  errorMessage?: string
  onCancel: () => void
  onConfirm: (request: Ali1688EnterpriseSelfUseTokenRequest) => void
}

export function Ali1688AuthorizationModal({
  open,
  submitting,
  errorMessage,
  onCancel,
  onConfirm
}: Ali1688AuthorizationModalProps) {
  const [form] = Form.useForm<Ali1688EnterpriseSelfUseTokenRequest>()
  return (
    <Modal
      title="授权 1688"
      open={open}
      okText="确认授权"
      cancelText="取消"
      confirmLoading={submitting}
      onCancel={() => {
        form.resetFields()
        onCancel()
      }}
      onOk={() => void form.validateFields().then((values) => {
        onConfirm(values)
        form.resetFields()
      })}
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
        <Paragraph>这是企业自用应用：请在 1688 开放平台点击“刷新”后，将新的永久 accessToken 粘贴到这里。</Paragraph>
        <Paragraph>
          <Text strong>不会付款</Text>，也<Text strong>不会创建订单</Text>，不会发起询盘或售后操作。
        </Paragraph>
        <Form form={form} layout="vertical" requiredMark="optional">
          <Form.Item
            label="1688 授权用户名"
            name="providerAccountId"
            rules={[{ required: true, whitespace: true, message: '请填写 1688 授权用户名' }]}
          >
            <Input autoComplete="off" placeholder="与 1688 授权配置页显示的用户名一致" />
          </Form.Item>
          <Form.Item label="账号备注" name="accountLabel">
            <Input autoComplete="off" placeholder="可选，例如：1688 采购主账号" />
          </Form.Item>
          <Form.Item
            label="企业自用 accessToken"
            name="accessToken"
            rules={[{ required: true, whitespace: true, message: '请粘贴新的 accessToken' }]}
          >
            <Input.Password autoComplete="off" placeholder="仅加密保存，不会再次显示" />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
