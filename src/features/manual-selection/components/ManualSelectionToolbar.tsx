import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Form, Input, Select, Space } from 'antd'
import { MANUAL_SELECTION_CHANNEL_OPTIONS, MANUAL_SELECTION_STATUS_OPTIONS } from '../constants'
import type { ManualSelectionToolbarProps } from '../types'

export function ManualSelectionToolbar(props: ManualSelectionToolbarProps) {
  const { form, loading, onOpenNewCollection, onRefresh, onSearch } = props

  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid #edf0f5' }}>
      <Space wrap size={[8, 8]} align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Form form={form} layout="inline" onFinish={onSearch}>
          <Form.Item name="channel" style={{ marginBottom: 0 }}>
            <Select
              allowClear
              placeholder="三方渠道"
              options={MANUAL_SELECTION_CHANNEL_OPTIONS}
              style={{ width: 150 }}
            />
          </Form.Item>
          <Form.Item name="productTitleEn" style={{ marginBottom: 0 }}>
            <Input placeholder="英文名" style={{ width: 210 }} />
          </Form.Item>
          <Form.Item name="productTitleCn" style={{ marginBottom: 0 }}>
            <Input placeholder="中文名" style={{ width: 210 }} />
          </Form.Item>
          <Form.Item name="collectStatus" style={{ marginBottom: 0 }}>
            <Select
              allowClear
              placeholder="采集状态"
              options={MANUAL_SELECTION_STATUS_OPTIONS}
              style={{ width: 150 }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button htmlType="submit" type="primary" ghost icon={<SearchOutlined />}>
              搜索
            </Button>
          </Form.Item>
        </Form>

        <Space.Compact>
          <Button data-testid="manual-selection-new-button" type="primary" ghost icon={<PlusOutlined />} onClick={onOpenNewCollection}>
            新建采集
          </Button>
          <Button data-testid="manual-selection-refresh-button" icon={<ReloadOutlined />} loading={loading} onClick={onRefresh} />
        </Space.Compact>
      </Space>
    </div>
  )
}
