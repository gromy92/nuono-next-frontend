import { BarChartOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Form, Input, Select, Space } from 'antd'
import {
  MANUAL_SELECTION_ANALYSIS_LINKED_OPTIONS,
  MANUAL_SELECTION_CHANNEL_OPTIONS,
  MANUAL_SELECTION_COLLECTION_SOURCE_OPTIONS,
  MANUAL_SELECTION_STATUS_OPTIONS
} from '../constants'
import type { ManualSelectionToolbarProps } from '../types'

export function ManualSelectionToolbar(props: ManualSelectionToolbarProps) {
  const { form, loading, onBatchAddToAnalysis, onOpenNewCollection, onRefresh, onReset, onSearch, selectedCount } = props

  return (
    <div className="manual-selection-toolbar">
      <div className="manual-selection-toolbar-inner">
        <Form className="manual-selection-toolbar-form" form={form} layout="inline" onFinish={onSearch}>
          <Form.Item name="channel" style={{ marginBottom: 0 }}>
            <Select
              allowClear
              data-testid="manual-selection-channel-filter"
              placeholder="三方渠道"
              options={MANUAL_SELECTION_CHANNEL_OPTIONS}
              style={{ width: 112 }}
            />
          </Form.Item>
          <Form.Item name="productTitleEn" style={{ marginBottom: 0 }}>
            <Input allowClear placeholder="英文名" style={{ width: 158 }} />
          </Form.Item>
          <Form.Item name="productTitleCn" style={{ marginBottom: 0 }}>
            <Input allowClear placeholder="中文名" style={{ width: 148 }} />
          </Form.Item>
          <Form.Item name="collectStatus" style={{ marginBottom: 0 }}>
            <Select
              allowClear
              data-testid="manual-selection-status-filter"
              placeholder="采集状态"
              options={MANUAL_SELECTION_STATUS_OPTIONS}
              style={{ width: 112 }}
            />
          </Form.Item>
          <Form.Item name="collectionSource" style={{ marginBottom: 0 }}>
            <Select
              allowClear
              data-testid="manual-selection-collection-source-filter"
              placeholder="采集来源"
              options={MANUAL_SELECTION_COLLECTION_SOURCE_OPTIONS}
              style={{ width: 106 }}
            />
          </Form.Item>
          <Form.Item name="analysisLinkedStatus" style={{ marginBottom: 0 }}>
            <Select
              allowClear
              data-testid="manual-selection-linked-filter"
              placeholder="组状态"
              options={MANUAL_SELECTION_ANALYSIS_LINKED_OPTIONS}
              style={{ width: 102 }}
            />
          </Form.Item>
          <Form.Item name="projectName" style={{ marginBottom: 0 }}>
            <Input allowClear placeholder="组名" style={{ width: 126 }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button className="manual-selection-action-search" htmlType="submit" type="primary" icon={<SearchOutlined />}>
              搜索
            </Button>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button onClick={onReset}>
              重置
            </Button>
          </Form.Item>
        </Form>

        <Space.Compact className="manual-selection-toolbar-actions">
          <Button
            className="manual-selection-action-analysis"
            data-testid="manual-selection-batch-analysis-button"
            icon={<BarChartOutlined />}
            disabled={!selectedCount}
            title={selectedCount ? '将已勾选商品加入组' : '先勾选采集成功的商品'}
            onClick={onBatchAddToAnalysis}
          >
            {selectedCount ? `批量加入组 (${selectedCount})` : '批量加入组'}
          </Button>
          <Button className="manual-selection-action-create" data-testid="manual-selection-new-button" type="primary" icon={<PlusOutlined />} onClick={onOpenNewCollection}>
            新建采集
          </Button>
          <Button className="manual-selection-action-refresh" data-testid="manual-selection-refresh-button" icon={<ReloadOutlined />} loading={loading} title="刷新列表" aria-label="刷新列表" onClick={onRefresh} />
        </Space.Compact>
      </div>
    </div>
  )
}
