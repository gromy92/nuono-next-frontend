import { Alert, Segmented } from 'antd'
import type { AsnCandidateSourceMode } from '../hooks/useOfficialWarehouseAsnLineSelection'

export function OfficialWarehouseCandidateSourcePicker({
  mode,
  shippingBatchSelected,
  batchSelectedCount,
  manualSelectedCount,
  onChange
}: {
  mode: AsnCandidateSourceMode
  shippingBatchSelected: boolean
  batchSelectedCount: number
  manualSelectedCount: number
  onChange: (mode: AsnCandidateSourceMode) => void
}) {
  return (
    <div className="official-warehouse-source-mode-picker">
      <Segmented<AsnCandidateSourceMode>
        value={mode}
        options={[
          {
            label: `物流单商品（已选 ${batchSelectedCount}）`,
            value: 'batch',
            disabled: !shippingBatchSelected
          },
          { label: `添加其他 SKU（已选 ${manualSelectedCount}）`, value: 'manual' }
        ]}
        onChange={onChange}
      />
      {mode === 'manual' ? (
        <Alert
          type="info"
          showIcon
          message="这里可以添加不属于所选物流单的其他 SKU"
          description="手工添加数量会进入同一个 ASN，但不会占用或伪造所选物流单的商品数量。"
        />
      ) : null}
    </div>
  )
}
