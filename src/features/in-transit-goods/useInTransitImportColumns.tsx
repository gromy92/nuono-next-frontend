import { useMemo } from 'react'
import { Space, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type {
  InTransitImportIssue,
  InTransitImportPreviewBatch,
  InTransitImportPreviewLine
} from './types'
import { importIssueColor } from './InTransitGoodsPage.utils'

const { Text } = Typography

type ImportColumnsProps = {
  statusLabel: Map<string, string>
  transportLabel: Map<string, string>
  formatDestination: (code?: string | null) => string
}

export function useInTransitImportColumns({ statusLabel, transportLabel, formatDestination }: ImportColumnsProps) {
  const importIssueColumns = useMemo<ColumnsType<InTransitImportIssue>>(() => [
    { title: '级别', dataIndex: 'level', key: 'level', width: 80, render: (value) => <Tag color={importIssueColor(value)}>{value === 'error' ? '错误' : '提醒'}</Tag> },
    { title: '行号', dataIndex: 'rowNumber', key: 'rowNumber', width: 72, render: (value) => value ?? '-' },
    { title: '字段', dataIndex: 'field', key: 'field', width: 140, render: (value) => value || '-' },
    { title: '说明', dataIndex: 'message', key: 'message' }
  ], [])

  const importLineColumns = useMemo<ColumnsType<InTransitImportPreviewLine>>(() => [
    { title: '行', dataIndex: 'rowNumber', key: 'rowNumber', width: 60 },
    {
      title: 'PSKU',
      key: 'sku',
      width: 220,
      render: (_value, row) => (
        <Space direction="vertical" size={0}>
          <Text strong>{row.psku || '-'}</Text>
          <Text type="secondary">{row.productName || '-'}</Text>
        </Space>
      )
    },
    { title: '箱号', dataIndex: 'boxNo', key: 'boxNo', width: 150, render: (value) => value || '-' },
    {
      title: '数量',
      key: 'quantity',
      width: 160,
      render: (_value, row) => (
        <Space direction="vertical" size={0}>
          <Text>发货 {row.shippedQuantity ?? '-'}</Text>
          <Text>入仓 {row.receivedQuantity ?? '-'}</Text>
        </Space>
      )
    },
    {
      title: '箱规',
      key: 'carton',
      width: 180,
      render: (_value, row) => (
        <Space direction="vertical" size={0}>
          <Text>箱数 {row.cartonCount ?? '-'}</Text>
          <Text>单箱 {row.unitsPerCarton ?? '-'}</Text>
          <Text>重量 {row.cartonWeightKg ?? '-'}</Text>
          <Text>体积 {row.cartonVolumeCbm ?? '-'}</Text>
        </Space>
      )
    },
    {
      title: '校验',
      key: 'issues',
      width: 220,
      render: (_value, row) => (row.issues ?? []).length ? (
        <Space wrap size={4}>
          {row.issues?.map((issue) => (
            <Tag key={`${issue.code}-${issue.field}`} color={importIssueColor(issue.level)}>{issue.message}</Tag>
          ))}
        </Space>
      ) : <Tag color="green">可导入</Tag>
    }
  ], [])

  const importBatchColumns = useMemo<ColumnsType<InTransitImportPreviewBatch>>(() => [
    {
      title: '批次',
      key: 'batch',
      width: 180,
      render: (_value, row) => (
        <Space direction="vertical" size={0}>
          <Text strong>{row.batchReferenceNo || row.batchKey}</Text>
          <Text type="secondary">{row.trackingNo || row.containerNo || '-'}</Text>
        </Space>
      )
    },
    {
      title: '货代',
      key: 'forwarder',
      width: 170,
      render: (_value, row) => (
        <Space direction="vertical" size={0}>
          <Text>{row.standardForwarderName || row.rawForwarderName || '-'}</Text>
          {row.forwarderQualityStatus === 'forwarder_matched' ? null : <Tag color="gold" style={{ marginInlineEnd: 0 }}>待匹配</Tag>}
        </Space>
      )
    },
    { title: '运输', dataIndex: 'transportMode', key: 'transportMode', width: 90, render: (value) => value ? <Tag>{transportLabel.get(value) || value}</Tag> : '-' },
    { title: '状态', dataIndex: 'batchStatus', key: 'batchStatus', width: 100, render: (value) => value ? <Tag>{statusLabel.get(value) || value}</Tag> : '-' },
    {
      title: '目的地',
      key: 'target',
      width: 180,
      render: (_value, row) => (
        <Space direction="vertical" size={0}>
          <Text>{formatDestination(row.targetStoreCode)}</Text>
          <Text type="secondary">{row.targetWarehouseName || '-'}</Text>
        </Space>
      )
    },
    { title: '预计到仓', dataIndex: 'etaDate', key: 'etaDate', width: 100, render: (value) => value || '-' },
    { title: '商品行', key: 'lineCount', width: 90, render: (_value, row) => row.lines?.length ?? 0 }
  ], [formatDestination, statusLabel, transportLabel])

  return { importIssueColumns, importLineColumns, importBatchColumns }
}
