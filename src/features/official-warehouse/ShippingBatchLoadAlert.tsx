import { Alert, Button } from 'antd'

type ShippingBatchLoadAlertProps = {
  error?: string
  onRetry: () => void
}

export function ShippingBatchLoadAlert({ error, onRetry }: ShippingBatchLoadAlertProps) {
  if (!error) return null
  return (
    <Alert
      type="warning"
      showIcon
      message="物流批次加载未完整成功"
      description={error}
      action={<Button size="small" onClick={onRetry}>重试</Button>}
    />
  )
}
