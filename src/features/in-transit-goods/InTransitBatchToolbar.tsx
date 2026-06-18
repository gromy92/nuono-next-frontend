import { Button, DatePicker, Input, Select, Space } from 'antd'
import { PlusOutlined, ReloadOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons'
import type { InTransitBatchFilters } from './types'

const { RangePicker } = DatePicker

type ToolbarOption = {
  label: string
  value: string
}

type InTransitBatchToolbarProps = {
  filters: InTransitBatchFilters
  loading: boolean
  forwarderFilterValue?: string
  forwarderFilterOptions: ToolbarOption[]
  transportOptions: ToolbarOption[]
  destinationOptions: ToolbarOption[]
  statusOptions: ToolbarOption[]
  onForwarderChange: (value?: string) => void
  onFilterChange: (patch: Partial<InTransitBatchFilters>) => void
  onRefresh: () => void
  onOpenSuperSearch: () => void
  onOpenImport: () => void
  onOpenCreate: () => void
}

export function InTransitBatchToolbar({
  filters,
  loading,
  forwarderFilterValue,
  forwarderFilterOptions,
  transportOptions,
  destinationOptions,
  statusOptions,
  onForwarderChange,
  onFilterChange,
  onRefresh,
  onOpenSuperSearch,
  onOpenImport,
  onOpenCreate
}: InTransitBatchToolbarProps) {
  return (
    <div className="in-transit-page__toolbar">
      <Select
        allowClear
        aria-label="货代"
        placeholder="货代"
        options={forwarderFilterOptions}
        value={forwarderFilterValue}
        onChange={(value) => onForwarderChange(value)}
      />
      <Select
        allowClear
        placeholder="运输方式"
        options={transportOptions}
        value={filters.transportMode}
        onChange={(value) => onFilterChange({ transportMode: value })}
      />
      <Input
        allowClear
        placeholder="PSKU/商品"
        value={filters.skuKeyword}
        onChange={(event) => onFilterChange({ skuKeyword: event.target.value })}
      />
      <Select
        allowClear
        aria-label="目的地"
        placeholder="目的地"
        options={destinationOptions}
        value={filters.targetStoreCode}
        onChange={(value) => onFilterChange({ targetStoreCode: value })}
      />
      <Select
        placeholder="批次范围"
        options={[
          { label: '未完成', value: 'active' },
          { label: '已完成', value: 'completed' },
          { label: '全部历史', value: 'all' }
        ]}
        value={filters.statusScope}
        onChange={(value) => onFilterChange({ statusScope: value })}
      />
      <Select
        allowClear
        placeholder="当前状态"
        options={statusOptions}
        value={filters.batchStatus}
        onChange={(value) => onFilterChange({ batchStatus: value })}
      />
      <RangePicker
        placeholder={['预计到仓开始', '预计到仓结束']}
        onChange={(dates) => onFilterChange({
          etaFrom: dates?.[0]?.format('YYYY-MM-DD'),
          etaTo: dates?.[1]?.format('YYYY-MM-DD')
        })}
      />
      <Space className="in-transit-page__toolbar-actions">
        <Button icon={<SearchOutlined />} onClick={onOpenSuperSearch}>
          超级搜索
        </Button>
        <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
          刷新
        </Button>
        <Button icon={<UploadOutlined />} onClick={onOpenImport}>
          导入预览
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={onOpenCreate}>
          新建批次
        </Button>
      </Space>
    </div>
  )
}
