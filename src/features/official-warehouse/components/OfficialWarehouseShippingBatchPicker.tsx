import { Button, Select, Typography } from 'antd'
import type { OfficialWarehouseShippingBatchCandidate } from '../api'
import { ShippingBatchLoadAlert } from '../ShippingBatchLoadAlert'
import { ShippingBatchDiagnosticAlert } from '../ShippingBatchDiagnosticAlert'
import { shippingBatchDiagnosticEmptyText } from '../shippingBatchDiagnosticPresentation'
import type { OfficialWarehouseShippingBatchDiagnostic } from '../shippingBatchDiagnosticTypes'

const { Text } = Typography

type Props = {
  error?: string
  diagnostic?: OfficialWarehouseShippingBatchDiagnostic
  loadBatches: (keyword?: string, prepareProductMatches?: boolean, forceRefresh?: boolean) => Promise<void>
  keyword: string
  loading: boolean
  batches: OfficialWarehouseShippingBatchCandidate[]
  selectedIds: string[]
  options: Array<{ label: string; value: string; disabled?: boolean }>
  onSearch: (value: string) => void
  onChange: (value: string[]) => void
}

export function OfficialWarehouseShippingBatchPicker({
  error,
  diagnostic,
  loadBatches,
  keyword,
  loading,
  batches,
  selectedIds,
  options,
  onSearch,
  onChange
}: Props) {
  return (
    <div className="official-warehouse-shipping-picker">
      <div className="official-warehouse-shipping-picker-header">
        <Text strong>物流批次号</Text>
        <Button
          type="link"
          size="small"
          loading={loading}
          onClick={() => void loadBatches(keyword, true, true)}
        >
          刷新物流匹配
        </Button>
      </div>
      <ShippingBatchLoadAlert
        error={error}
        onRetry={() => void loadBatches(keyword, false, true)}
      />
      <ShippingBatchDiagnosticAlert diagnostic={diagnostic} />
      <Select
        mode="multiple"
        allowClear
        showSearch
        placeholder="选择物流批次号"
        loading={loading}
        disabled={loading && !batches.length}
        value={selectedIds}
        options={options}
        notFoundContent={shippingBatchDiagnosticEmptyText(diagnostic, loading)}
        filterOption={false}
        onSearch={onSearch}
        onChange={(value) => onChange(Array.isArray(value) ? value : [])}
        maxTagCount="responsive"
      />
    </div>
  )
}
