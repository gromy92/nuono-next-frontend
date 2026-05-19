import { Space } from 'antd'
import { OperationPriceMaintenanceSection } from './components/OperationPriceMaintenanceSection'

export function LogisticsQuoteBoard() {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <OperationPriceMaintenanceSection />
    </Space>
  )
}
