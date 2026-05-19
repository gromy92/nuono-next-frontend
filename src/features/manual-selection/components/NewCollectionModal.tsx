import { Form, Input, Modal } from 'antd'
import type { FormInstance } from 'antd'
import type { NewCollectionValues } from '../types'

type NewCollectionModalProps = {
  open: boolean
  form: FormInstance<NewCollectionValues>
  submitting: boolean
  onCancel: () => void
  onSubmit: (values: NewCollectionValues) => void
}

export function NewCollectionModal(props: NewCollectionModalProps) {
  const { open, form, submitting, onCancel, onSubmit } = props

  return (
    <Modal
      title="新建采集"
      open={open}
      data-testid="manual-selection-new-modal"
      width={480}
      okText="开始采集"
      cancelText="取消"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item label="中文标题" name="titleCn" help="用于小伙伴识别产品">
          <Input placeholder="请输入中文标题" />
        </Form.Item>
        <Form.Item
          label="三方链接"
          name="siteLink"
          rules={[{ required: true, message: '请输入三方链接' }]}
          help="支持 Noon / Amazon / SHEIN 商品页链接"
        >
          <Input placeholder="请输入三方链接" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
