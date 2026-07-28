import { Button, Empty, InputNumber, List, Space, Spin, Tag, Typography } from 'antd'
import type { Ali1688HistoricalOrderAssignmentRecord } from '../types'
import {
  assignmentRecordStatusText,
  assignmentRecordTargetLabel,
  isStorelessFullLineAssignmentRecord
} from '../model/assignmentTargets'

const { Text } = Typography

type Props = {
  assignmentRecords: Ali1688HistoricalOrderAssignmentRecord[]
  assignmentRecordsLoading: boolean
  assignmentRecordQuantities: Record<string, number | null>
  assignmentRecordUpdatingId?: number
  updateAssignmentRecordQuantity: (assignmentId: number | undefined, value: number | string | null) => void
  submitAssignmentRecordAdjustment: (record: Ali1688HistoricalOrderAssignmentRecord) => Promise<void>
  submitAssignmentRecordRevoke: (record: Ali1688HistoricalOrderAssignmentRecord) => Promise<void>
}

export function Ali1688AssignmentRecords({
  assignmentRecords, assignmentRecordsLoading, assignmentRecordQuantities,
  assignmentRecordUpdatingId, updateAssignmentRecordQuantity,
  submitAssignmentRecordAdjustment, submitAssignmentRecordRevoke
}: Props) {
    return (
      <section className="ali1688-assignment-records" aria-label="分配记录">
        <Text strong>分配记录</Text>
        <Spin spinning={assignmentRecordsLoading}>
          <List
            size="small"
            dataSource={assignmentRecords}
            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无分配记录" /> }}
            renderItem={(record) => {
              const targetLabel = assignmentRecordTargetLabel(record)
              const disabled = record.status !== 'active'
              const fullLineRecord = isStorelessFullLineAssignmentRecord(record)
              return (
                <List.Item
                  actions={[
                    fullLineRecord ? null : (
                      <InputNumber
                        key="quantity"
                        aria-label={`调整数量 ${targetLabel}`}
                        min={1}
                        value={
                          record.assignmentId
                            ? assignmentRecordQuantities[record.assignmentId] ?? record.assignedQuantity
                            : record.assignedQuantity
                        }
                        disabled={disabled}
                        onChange={(value) => updateAssignmentRecordQuantity(record.assignmentId, value)}
                      />
                    ),
                    fullLineRecord ? null : (
                      <Button
                        key="adjust"
                        loading={assignmentRecordUpdatingId === record.assignmentId}
                        disabled={disabled}
                        onClick={() => void submitAssignmentRecordAdjustment(record)}
                      >
                        调整 {targetLabel}
                      </Button>
                    ),
                    <Button
                      key="revoke"
                      danger
                      loading={assignmentRecordUpdatingId === record.assignmentId}
                      disabled={disabled}
                      onClick={() => void submitAssignmentRecordRevoke(record)}
                    >
                      撤回 {targetLabel}
                    </Button>
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    title={
                      <Space size={8} wrap>
                        <Text>{targetLabel}</Text>
                        <Tag color={record.status === 'active' ? 'processing' : 'default'}>
                          {assignmentRecordStatusText(record.status)}
                        </Tag>
                        <Text type="secondary">数量 {record.assignedQuantity ?? 0}</Text>
                      </Space>
                    }
                    description={
                      <Space size={8} wrap>
                        <Text type="secondary">创建 {record.createdBy ?? '-'} · {record.createdAt || '-'}</Text>
                        <Text type="secondary">更新 {record.updatedBy ?? '-'} · {record.updatedAt || '-'}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )
            }}
          />
        </Spin>
      </section>
    )
  }
