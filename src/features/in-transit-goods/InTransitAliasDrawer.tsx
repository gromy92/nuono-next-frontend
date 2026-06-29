import { Button, Drawer, Form, Input, Select, Space } from 'antd'
import type { InTransitBatch } from './types'

type InTransitAliasDrawerProps = {
  open: boolean
  targetBatch: InTransitBatch | null
  aliasForwarderId?: number
  saving: boolean
  forwarderOptions: Array<{ label: string; value: number }>
  onForwarderChange: (value?: number) => void
  onClose: () => void
  onSubmit: () => void
}

export function InTransitAliasDrawer({
  open,
  targetBatch,
  aliasForwarderId,
  saving,
  forwarderOptions,
  onForwarderChange,
  onClose,
  onSubmit
}: InTransitAliasDrawerProps) {
  return (
    <Drawer
      title="货代归一"
      open={open}
      width={420}
      destroyOnClose
      onClose={onClose}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={saving} onClick={onSubmit}>
            保存归一
          </Button>
        </Space>
      }
    >
      <Form layout="vertical">
        <Form.Item label="原始货代名称">
          <Input value={targetBatch?.rawForwarderName || ''} readOnly />
        </Form.Item>
        <Form.Item label="标准货代" required>
          <Select
            allowClear
            options={forwarderOptions}
            placeholder="选择标准货代"
            value={aliasForwarderId}
            onChange={onForwarderChange}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
