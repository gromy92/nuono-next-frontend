import { useEffect, useState } from 'react'
import { Alert, Button, Input, InputNumber, Modal, Space, Typography } from 'antd'
import { saveLogisticsQuoteOperationPriceAdjustment } from '../api'
import type { LogisticsQuoteOperationPriceItemDto } from '../types'
import { formatOperationPrice, transportModeLabel } from '../utils'

const { Text } = Typography

type AdjustmentSaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'error'; message: string }

type OperationPriceAdjustmentModalProps = {
  item: LogisticsQuoteOperationPriceItemDto | null
  onCancel: () => void
  onSaved: (message: string) => void
}

export function OperationPriceAdjustmentModal({
  item,
  onCancel,
  onSaved
}: OperationPriceAdjustmentModalProps) {
  const [adjustedValue, setAdjustedValue] = useState<number | null>(null)
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [saveState, setSaveState] = useState<AdjustmentSaveState>({ status: 'idle' })

  useEffect(() => {
    if (!item) {
      return
    }
    setAdjustedValue(typeof item.effectiveValue === 'number' ? item.effectiveValue : null)
    setAdjustmentReason(item.adjustmentReason || '')
    setSaveState({ status: 'idle' })
  }, [item])

  const saveAdjustment = async () => {
    if (!item) {
      return
    }
    if (typeof adjustedValue !== 'number') {
      setSaveState({ status: 'error', message: '请填写调整后的数值。' })
      return
    }
    const trimmedReason = adjustmentReason.trim()
    if (!trimmedReason) {
      setSaveState({ status: 'error', message: '请填写调整原因，便于后续审计。' })
      return
    }

    setSaveState({ status: 'saving' })
    try {
      const result = await saveLogisticsQuoteOperationPriceAdjustment({
        targetType: item.targetType,
        targetId: item.targetId,
        numericField: item.numericField,
        adjustedValue,
        reason: trimmedReason
      })
      setSaveState({ status: 'idle' })
      onSaved(result.message || '运营调整已保存。')
    } catch (error) {
      setSaveState({
        status: 'error',
        message: error instanceof Error ? error.message : '运营调整保存失败'
      })
    }
  }

  return (
    <Modal
      title="调整运营有效价"
      open={Boolean(item)}
      onCancel={onCancel}
      width={640}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" loading={saveState.status === 'saving'} onClick={() => void saveAdjustment()}>
            保存调整
          </Button>
        </Space>
      }
    >
      {item ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type="info"
            showIcon
            message="只调整运营有效价"
            description="保存后写入运营调整层和审计日志，不覆盖管理员标准报价底稿。"
          />
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary">费用对象</Text>
            <Text strong>{item.cargoCategoryName || item.numericField}</Text>
            <Text type="secondary">
              {item.forwarderName || '-'} / {item.quoteVersionNo || '-'} / {transportModeLabel(item.transportMode)}
            </Text>
          </Space>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary">标准价</Text>
            <Text>{formatOperationPrice(item.standardValue, item.currency, item.billingUnit)}</Text>
          </Space>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary">运营调整值</Text>
            <InputNumber
              min={0}
              precision={4}
              value={adjustedValue}
              style={{ width: '100%' }}
              addonAfter={item.billingUnit || undefined}
              onChange={(value) => setAdjustedValue(typeof value === 'number' ? value : null)}
            />
          </Space>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary">调整原因</Text>
            <Input.TextArea
              value={adjustmentReason}
              rows={4}
              maxLength={500}
              showCount
              placeholder="例如：本周与货代确认临时折扣，运营有效价下调。"
              onChange={(event) => setAdjustmentReason(event.target.value)}
            />
          </Space>
          {saveState.status === 'error' ? <Alert type="error" showIcon message={saveState.message} /> : null}
        </Space>
      ) : null}
    </Modal>
  )
}
