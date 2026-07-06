import { DatePicker, Form, Input, Modal, Radio, Space, Tag, Typography } from 'antd'
import type { FormInstance } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import type { InTransitBatch } from './types'
import { formatNodeDate, formatNodeDateTime } from './InTransitGoodsPage.utils'

const { Text } = Typography

type EstimatedArrivalFormValues = {
  maintenanceType?: 'estimated' | 'actual'
  arrivalAt?: Dayjs
  note?: string
}

type InTransitEstimatedArrivalModalProps = {
  open: boolean
  submitting: boolean
  targetBatch: InTransitBatch | null
  form: FormInstance<EstimatedArrivalFormValues>
  onCancel: () => void
  onSubmit: () => void
}

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: '人工维护',
  OFFICIAL: '官方 ETA',
  AIR_HISTORY_ESTIMATE: '历史推算',
  PLUGIN_REPORTED: '插件采集',
  LEGACY_IMPORTED: '历史导入'
}

const SOURCE_COLORS: Record<string, string> = {
  MANUAL: 'green',
  OFFICIAL: 'blue',
  AIR_HISTORY_ESTIMATE: 'orange',
  PLUGIN_REPORTED: 'purple',
  LEGACY_IMPORTED: 'default'
}

export function estimatedArrivalSourceLabel(source?: string | null) {
  if (!source) {
    return '未标记'
  }
  return SOURCE_LABELS[source] || source
}

export function estimatedArrivalSourceColor(source?: string | null) {
  return source ? SOURCE_COLORS[source] || 'default' : 'default'
}

export function InTransitEstimatedArrivalModal({
  open,
  submitting,
  targetBatch,
  form,
  onCancel,
  onSubmit
}: InTransitEstimatedArrivalModalProps) {
  const estimatedArrivalValue = parsePickerValue(targetBatch?.estimatedArrivalAt)
  const actualArrivalText =
    targetBatch?.latestNodeStatus === 'warehouse_received' ? formatNodeDateTime(targetBatch.latestNodeHappenedAt) : '-'
  const actualArrivalValue =
    targetBatch?.latestNodeStatus === 'warehouse_received' ? parsePickerValue(targetBatch.latestNodeHappenedAt) : undefined

  return (
    <Modal
      title="维护到达时间"
      open={open}
      onCancel={onCancel}
      onOk={onSubmit}
      okText="保存"
      cancelText="取消"
      confirmLoading={submitting}
      destroyOnClose
    >
      {targetBatch ? (
        <Space direction="vertical" size={12} className="in-transit-eta-modal">
          <Space size={8} wrap>
            <Text strong>{targetBatch.batchReferenceNo || `#${targetBatch.batchId}`}</Text>
            <Tag color={estimatedArrivalSourceColor(targetBatch.estimatedArrivalSource)} style={{ marginInlineEnd: 0 }}>
              {estimatedArrivalSourceLabel(targetBatch.estimatedArrivalSource)}
            </Tag>
          </Space>
          <Text type="secondary">当前 ETA {targetBatch.estimatedArrivalAt ? formatNodeDate(targetBatch.estimatedArrivalAt) : targetBatch.etaDate || '-'}</Text>
          <Text type="secondary">当前实际到达 {actualArrivalText}</Text>
          <Form form={form} layout="vertical">
            <Form.Item name="maintenanceType" label="维护类型" rules={[{ required: true, message: '请选择维护类型' }]}>
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                onChange={(event) => {
                  form.setFieldsValue({
                    arrivalAt: event.target.value === 'actual' ? actualArrivalValue : estimatedArrivalValue
                  })
                }}
                options={[
                  { label: '预计到达时间', value: 'estimated' },
                  { label: '实际到达时间', value: 'actual' }
                ]}
              />
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(previous, current) => previous.maintenanceType !== current.maintenanceType}>
              {({ getFieldValue }) => {
                const isActual = getFieldValue('maintenanceType') === 'actual'
                return (
                  <Form.Item
                    name="arrivalAt"
                    label={isActual ? '实际到达时间' : '预计到达时间'}
                    rules={[{ required: true, message: isActual ? '请选择实际到达时间' : '请选择预计到达时间' }]}
                  >
                    {isActual ? (
                      <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
                    ) : (
                      <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
                    )}
                  </Form.Item>
                )
              }}
            </Form.Item>
            <Form.Item name="note" label="备注">
              <Input.TextArea rows={3} maxLength={500} showCount />
            </Form.Item>
          </Form>
        </Space>
      ) : null}
    </Modal>
  )
}

function parsePickerValue(value?: string | null) {
  const parsed = value ? dayjs(value) : null
  return parsed?.isValid() ? parsed : undefined
}
