import { Alert, Typography } from 'antd'
import type { OfficialWarehouseShippingBatchDiagnostic } from './shippingBatchDiagnosticTypes'

const { Text } = Typography

export function ShippingBatchDiagnosticAlert({
  diagnostic
}: {
  diagnostic?: OfficialWarehouseShippingBatchDiagnostic
}) {
  if (!diagnostic) return null
  return (
    <Alert
      type={diagnostic.severity}
      showIcon
      message={diagnostic.title}
      description={(
        <div className="official-warehouse-stack">
          <Text>{diagnostic.message}</Text>
          {diagnostic.action ? <Text strong>处理建议：{diagnostic.action}</Text> : null}
        </div>
      )}
    />
  )
}
