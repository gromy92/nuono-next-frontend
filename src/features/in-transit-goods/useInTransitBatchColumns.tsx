import { useMemo } from 'react'
import { Button, Space, Tag, Typography } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { InTransitBatch, InTransitBatchFilters } from './types'
import type { BoxDetailTabKey } from './InTransitGoodsPage.models'
import { MISSING_FIELD_LABELS } from './InTransitGoodsPage.constants'
import { estimatedArrivalSourceColor, estimatedArrivalSourceLabel } from './InTransitEstimatedArrivalModal'
import { buildBatchNodeHistoryItems } from './batchNodeHistory'
import {
  formatInTransitDuration,
  formatNodeDate,
  formatNodeDateTime
} from './InTransitGoodsPage.utils'

const { Text } = Typography

type BatchColumnsProps = {
  statusLabel: Map<string, string>
  transportLabel: Map<string, string>
  nodeStatusLabel: Map<string, string>
  formatDestination: (code?: string | null) => string
  batchSortOrder: (field: NonNullable<InTransitBatchFilters['sortField']>) => 'ascend' | 'descend' | null
  onOpenForwarderAlias: (row: InTransitBatch) => void
  onOpenBoxDetail: (row: InTransitBatch, initialTab: BoxDetailTabKey) => void
  onOpenEdit: (row: InTransitBatch) => void
  onOpenEstimatedArrival: (row: InTransitBatch) => void
}

export function useInTransitBatchColumns({
  statusLabel,
  transportLabel,
  nodeStatusLabel,
  formatDestination,
  batchSortOrder,
  onOpenForwarderAlias,
  onOpenBoxDetail,
  onOpenEdit,
  onOpenEstimatedArrival
}: BatchColumnsProps): ColumnsType<InTransitBatch> {
  return useMemo(() => [
    {
      title: '货代/运输',
      key: 'forwarder',
      fixed: 'left',
      width: 150,
      render: (_value, row) => (
        <Space direction="vertical" size={2}>
          <Text>{row.standardForwarderName || row.rawForwarderName || '-'}</Text>
          {row.forwarderQualityStatus === 'forwarder_unmatched' ? (
            <Button type="link" size="small" className="in-transit-batch-cell__box-link" onClick={() => onOpenForwarderAlias(row)}>
              匹配货代
            </Button>
          ) : null}
          {row.transportMode ? (
            <Tag color={row.transportMode === 'AIR' ? 'blue' : 'cyan'} style={{ marginInlineEnd: 0 }}>
              {transportLabel.get(row.transportMode) || row.transportMode}
            </Tag>
          ) : (
            <Text type="secondary">-</Text>
          )}
          <Tag color={row.batchStatus === 'exception' ? 'red' : row.batchStatus === 'draft' ? 'default' : 'purple'} style={{ marginInlineEnd: 0 }}>
            {statusLabel.get(row.batchStatus || '') || row.batchStatus || '-'}
          </Tag>
        </Space>
      )
    },
    {
      title: '批次号',
      key: 'batch',
      fixed: 'left',
      width: 210,
      render: (_value, row) => (
        <Space direction="vertical" size={2} className="in-transit-batch-cell">
          <Text strong>{row.batchReferenceNo || `#${row.batchId}`}</Text>
          <Text type="secondary">目的地 {formatDestination(row.targetStoreCode)}</Text>
          <Space size={8} wrap className="in-transit-batch-cell__meta">
            <Button type="link" size="small" className="in-transit-batch-cell__box-link" onClick={() => onOpenBoxDetail(row, 'box')}>
              箱数 {row.boxCount ?? row.cartonCountTotal ?? '-'}
            </Button>
            <Button type="link" size="small" className="in-transit-batch-cell__box-link" onClick={() => onOpenBoxDetail(row, 'product')}>
              PSKU {row.skuCount ?? '-'}
            </Button>
          </Space>
        </Space>
      )
    },
    {
      title: '时间节点',
      dataIndex: 'etaDate',
      key: 'timeNodes',
      width: 380,
      sorter: true,
      sortOrder: batchSortOrder('etaDate'),
      render: (_value, row) => renderTimeNodes(row, nodeStatusLabel, onOpenEstimatedArrival)
    },
    {
      title: '时间统计',
      key: 'timeStats',
      width: 140,
      render: (_value, row) => <Text>{formatInTransitDuration(row.domesticReceivedAt)}</Text>
    },
    {
      title: '汇总',
      key: 'summary',
      width: 260,
      render: (_value, row) => (
        <Space size={10} wrap>
          <span className="in-transit-page__stat">发货 {row.shippedQuantityTotal ?? '-'}</span>
          <span className="in-transit-page__stat">入仓 {row.receivedQuantityTotal ?? '-'}</span>
          <span className="in-transit-page__stat">剩余 {row.remainingQuantityTotal ?? '-'}</span>
          <span className="in-transit-page__stat">重量 {row.totalWeightKg ?? '-'}</span>
          <span className="in-transit-page__stat">体积 {row.totalVolumeCbm ?? '-'}</span>
        </Space>
      )
    },
    {
      title: '缺项',
      key: 'missing',
      width: 180,
      render: (_value, row) => (
        <div className="in-transit-page__missing">
          {(row.missingFields ?? []).length ? (
            row.missingFields?.map((item) => (
              <Tag key={item} color="gold" style={{ marginInlineEnd: 0 }}>
                {MISSING_FIELD_LABELS[item] || item}
              </Tag>
            ))
          ) : (
            <Text type="secondary">-</Text>
          )}
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 82,
      render: (_value, row) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => onOpenEdit(row)}>
          编辑
        </Button>
      )
    }
  ], [batchSortOrder, formatDestination, nodeStatusLabel, onOpenBoxDetail, onOpenEdit, onOpenEstimatedArrival, onOpenForwarderAlias, statusLabel, transportLabel])
}

function renderTimeNodes(
  row: InTransitBatch,
  nodeStatusLabel: Map<string, string>,
  onOpenEstimatedArrival: (row: InTransitBatch) => void
) {
  const actualArrivalText = row.actualArrivalAt ? formatNodeDateTime(row.actualArrivalAt) : undefined
  const estimatedArrivalText = row.estimatedArrivalAt ? formatNodeDate(row.estimatedArrivalAt) : row.etaDate || undefined
  const arrivalText = actualArrivalText || estimatedArrivalText || '未维护'
  const hasEffectiveArrival = Boolean(row.effectiveArrivalAt || row.actualArrivalAt || row.estimatedArrivalAt || row.etaDate)
  const effectiveArrivalSource = row.effectiveArrivalSource || row.estimatedArrivalSource
  const historyItems = buildBatchNodeHistoryItems(row.nodeHistory, nodeStatusLabel)
  return (
    <Space direction="vertical" size={2}>
      <Text type="secondary">国内收货 {formatNodeDateTime(row.domesticReceivedAt)}</Text>
      <Text type="secondary">出发时间 {row.departureDate || '-'}</Text>
      <Space size={6} wrap align="center">
        <Button
          type="link"
          size="small"
          danger={!hasEffectiveArrival}
          className={`in-transit-eta-edit${hasEffectiveArrival ? '' : ' in-transit-eta-edit--missing'}`}
          onClick={() => onOpenEstimatedArrival(row)}
        >
          到达时间 {arrivalText}
        </Button>
        {effectiveArrivalSource ? (
          <Tag color={estimatedArrivalSourceColor(effectiveArrivalSource)} style={{ marginInlineEnd: 0 }}>
            {estimatedArrivalSourceLabel(effectiveArrivalSource)}
          </Tag>
        ) : null}
      </Space>
      {actualArrivalText && estimatedArrivalText ? <Text type="secondary">预计到达 {estimatedArrivalText}</Text> : null}
      <Text type="secondary">历史状态时间</Text>
      {historyItems.length ? (
        <div className="in-transit-node-history">
          {historyItems.map((item) => (
            <div className="in-transit-node-history__item" key={item.nodeId}>
              <span className="in-transit-node-history__marker" aria-hidden="true" />
              <div className="in-transit-node-history__content">
                <Space size={6} wrap>
                  <Tag color={item.color} style={{ marginInlineEnd: 0 }}>{item.label}</Tag>
                  <Text type="secondary">{item.happenedAtText}</Text>
                </Space>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Text type="secondary">暂无历史节点</Text>
      )}
    </Space>
  )
}
