import { Alert, Button, Form, Input, message, Modal, Space } from 'antd'
import type { FormInstance, FormProps } from 'antd'
import { useState } from 'react'
import type { NewCollectionValues } from '../types'

type NewCollectionModalProps = {
  open: boolean
  form: FormInstance<NewCollectionValues>
  submitting: boolean
  onCancel: () => void
  onSubmit: (values: NewCollectionValues) => void
}

type SubmitFailure = Parameters<NonNullable<FormProps<NewCollectionValues>['onFinishFailed']>>[0]

const NEW_COLLECTION_FORM_ID = 'manual-selection-new-collection-form'

export function NewCollectionModal(props: NewCollectionModalProps) {
  const { open, form, submitting, onCancel, onSubmit } = props
  const [submitFailureMessage, setSubmitFailureMessage] = useState<string | null>(null)
  const siteLink = Form.useWatch('siteLink', form)
  const sheinPaused = (siteLink || '').toLowerCase().includes('shein.')
  const handleSubmitFailed = ({ errorFields }: SubmitFailure) => {
    const firstError = errorFields
      .flatMap((field) => field.errors)
      .find((error) => Boolean(error))
    if (firstError) {
      setSubmitFailureMessage(firstError)
      message.warning(firstError)
    }
  }
  const handleSubmit = (values: NewCollectionValues) => {
    setSubmitFailureMessage(null)
    onSubmit(values)
  }

  return (
    <Modal
      title="新建采集"
      open={open}
      data-testid="manual-selection-new-modal"
      width={480}
      footer={null}
      onCancel={onCancel}
    >
      <Form
        id={NEW_COLLECTION_FORM_ID}
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onFinishFailed={handleSubmitFailed}
        onValuesChange={() => setSubmitFailureMessage(null)}
      >
        {submitFailureMessage ? (
          <Alert
            data-testid="manual-selection-new-feedback"
            message={submitFailureMessage}
            showIcon
            style={{ marginBottom: 12 }}
            type="warning"
          />
        ) : null}
        <Form.Item
          label="三方链接"
          name="siteLink"
          rules={[
            { required: true, message: '请输入三方链接' },
            {
              validator: async (_, value?: string) => {
                if ((value || '').toLowerCase().includes('shein.')) {
                  throw new Error('SHEIN 完整采集暂缓，当前仅验收 Amazon / Noon。')
                }
              }
            }
          ]}
          validateStatus={sheinPaused ? 'error' : undefined}
          help={sheinPaused ? 'SHEIN 完整采集暂缓，当前仅验收 Amazon / Noon。' : '支持 Noon / Amazon 商品页链接；SHEIN 完整采集暂缓'}
        >
          <Input placeholder="请输入三方链接" />
        </Form.Item>
        <Form.Item label="中文标题" name="titleCn" help="用于小伙伴识别产品">
          <Input placeholder="请输入中文标题" />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button disabled={submitting} onClick={onCancel}>
              取消
            </Button>
            <Button htmlType="submit" loading={submitting} type="primary">
              开始采集
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}
