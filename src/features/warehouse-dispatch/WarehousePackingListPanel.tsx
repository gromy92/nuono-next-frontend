import { ReloadOutlined } from '@ant-design/icons'
import { Button, Empty, Select, Space, Table, Tag, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { loadOutboundOrders, loadPackingLists, loadShippingBatch, loadShippingBatches } from './api'
import type {
  OutboundOrder,
  PackingList,
  ShippingBatch,
  ShippingSuggestionOption,
  WarehouseFulfillmentType
} from './types'

const { Text } = Typography

const FULFILLMENT_LABELS: Record<WarehouseFulfillmentType, string> = {
  WAREHOUSE_RECEIPT: '到仓收货',
  FACTORY_DIRECT: '厂家直发'
}

const SHIPPING_BATCH_STATUS_META: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '待物流计划', color: 'gold' },
  OPTION_SELECTED: { label: '已给出物流计划', color: 'blue' },
  OUTBOUND_CREATED: { label: '已生成发货单', color: 'purple' },
  PACKING: { label: '装箱中', color: 'processing' },
  PACKED: { label: '已封箱', color: 'green' },
  SHIPPED: { label: '已发货', color: 'green' }
}

const OUTBOUND_ORDER_STATUS_META: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '待装箱', color: 'gold' },
  PACKING: { label: '装箱中', color: 'processing' },
  PACKED: { label: '已封箱', color: 'green' },
  SHIPPED: { label: '已发货', color: 'green' }
}

const PACKING_LIST_STATUS_META: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'gold' },
  CONFIRMED: { label: '已封箱', color: 'green' },
  SEALED: { label: '已封箱', color: 'green' },
  SHIPPED: { label: '已发货', color: 'green' }
}

const OUTBOUND_TABLE_PAGINATION = {
  pageSize: 30,
  showSizeChanger: true,
  pageSizeOptions: [20, 30, 50, 100],
  showTotal: (total: number) => `共 ${total} 行`,
  size: 'small' as const
}

export function WarehousePackingListPanel() {
  const [shippingBatches, setShippingBatches] = useState<ShippingBatch[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string>()
  const [outboundOrdersByBatch, setOutboundOrdersByBatch] = useState<Record<string, OutboundOrder[]>>({})
  const [packingListsByOutboundOrder, setPackingListsByOutboundOrder] = useState<Record<string, PackingList[]>>({})
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [loadError, setLoadError] = useState<string>()

  const selectedBatch = useMemo(
    () => shippingBatches.find((batch) => batch.id === selectedBatchId) || shippingBatches[0],
    [selectedBatchId, shippingBatches]
  )
  const selectedBatchDetailId = selectedBatch?.id
  const selectedOutboundOrders = selectedBatch ? outboundOrdersByBatch[selectedBatch.id] || [] : []
  const selectedPackingLists = selectedOutboundOrders.flatMap((order) => packingListsByOutboundOrder[order.id] || [])

  useEffect(() => {
    void refreshPackingLists()
  }, [])

  useEffect(() => {
    if (!shippingBatches.length) {
      setSelectedBatchId(undefined)
      return
    }
    if (!selectedBatchId || !shippingBatches.some((batch) => batch.id === selectedBatchId)) {
      setSelectedBatchId(shippingBatches[0].id)
    }
  }, [selectedBatchId, shippingBatches])

  useEffect(() => {
    if (!selectedBatchDetailId || outboundOrdersByBatch[selectedBatchDetailId]) {
      return
    }
    setDetailLoading(true)
    loadBatchDetails(selectedBatchDetailId)
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : '装箱单详情读取失败')
      })
      .finally(() => setDetailLoading(false))
  }, [outboundOrdersByBatch, selectedBatchDetailId])

  async function refreshPackingLists() {
    setLoading(true)
    setLoadError(undefined)
    try {
      const nextBatches = await loadShippingBatches()
      setShippingBatches(nextBatches)
      return nextBatches
    } catch (error) {
      const messageText = error instanceof Error ? error.message : '装箱单读取失败'
      setLoadError(messageText)
      message.error(messageText)
      return []
    } finally {
      setLoading(false)
    }
  }

  async function loadBatchDetails(batchId: string) {
    const [batchDetail, outboundOrders] = await Promise.all([
      loadShippingBatch(batchId).catch(() => undefined),
      loadOutboundOrders(batchId)
    ])
    if (batchDetail) {
      setShippingBatches((current) => current.map((batch) => (batch.id === batchDetail.id ? batchDetail : batch)))
    }
    const packingEntries = await Promise.all(
      outboundOrders.map(async (order) => [order.id, await loadPackingLists(order.id)] as const)
    )
    setOutboundOrdersByBatch((current) => ({ ...current, [batchId]: outboundOrders }))
    setPackingListsByOutboundOrder((current) => ({
      ...current,
      ...Object.fromEntries(packingEntries)
    }))
    return outboundOrders
  }

  const outboundOrderColumns: ColumnsType<OutboundOrder> = [
    {
      title: '发货单',
      dataIndex: 'outboundNo',
      width: 170,
      render: (_value, order) => (
        <Space direction="vertical" size={0}>
          <Text strong>{order.outboundNo || order.id}</Text>
          <Text type="secondary">{order.originName || FULFILLMENT_LABELS[order.originType || 'WAREHOUSE_RECEIPT']}</Text>
        </Space>
      )
    },
    {
      title: '状态',
      width: 110,
      render: (_value, order) => renderOutboundOrderStatus(order.status)
    },
    { title: 'PSKU', dataIndex: 'skuCount', width: 72 },
    { title: '数量', dataIndex: 'totalQuantity', width: 72 },
    {
      title: '商品',
      render: (_value, order) => (
        <Space direction="vertical" size={2}>
          {order.lines.slice(0, 3).map((line) => (
            <Text key={line.id} type="secondary">
              {line.psku || line.title} / {line.quantity} 件
            </Text>
          ))}
          {order.lines.length > 3 ? <Text type="secondary">还有 {order.lines.length - 3} 个 PSKU</Text> : null}
        </Space>
      )
    },
    {
      title: '装箱单',
      width: 220,
      render: (_value, order) => renderPackingListSummary(packingListsByOutboundOrder[order.id] || [])
    }
  ]

  return (
    <div className="warehouse-dispatch-panel">
      <div className="warehouse-dispatch-toolbar">
        <div className="warehouse-dispatch-toolbar-left">
          <Select
            className="warehouse-dispatch-filter-select"
            style={{ width: 260 }}
            placeholder="选择发货单"
            value={selectedBatch?.id}
            options={shippingBatches.map((batch) => ({
              label: `${batch.batchNo || batch.id} / ${batch.totalQuantity} 件`,
              value: batch.id
            }))}
            onChange={(value) => setSelectedBatchId(String(value))}
          />
          {selectedBatch ? renderShippingBatchStatus(selectedBatch.status) : null}
        </div>
        <div className="warehouse-dispatch-toolbar-right">
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => {
              void refreshPackingLists()
            }}
          >
            刷新
          </Button>
        </div>
      </div>
      {selectedBatch ? (
        <div className="warehouse-dispatch-plan-layout">
          <div>
            {renderSummaryGrid([
              ['批次号', selectedBatch.batchNo || selectedBatch.id],
              ['来源', selectedBatch.sourceCount],
              ['PSKU', selectedBatch.skuCount],
              ['数量', selectedBatch.totalQuantity],
              ['装箱单', selectedPackingLists.length]
            ])}
            <Table
              rowKey="id"
              size="small"
              columns={outboundOrderColumns}
              dataSource={selectedOutboundOrders}
              loading={detailLoading || loading}
              pagination={OUTBOUND_TABLE_PAGINATION}
              locale={{ emptyText: <Empty description={loadError || '当前发货单还没有装箱单'} /> }}
            />
          </div>
          <div className="warehouse-dispatch-route-list">
            {selectedBatch.options.length ? (
              selectedBatch.options.map(renderShippingOptionCard)
            ) : (
              <Empty description="暂无物流计划" />
            )}
          </div>
        </div>
      ) : (
        <Empty className="warehouse-dispatch-empty" description={loadError || '暂无装箱单，App 装箱提交后会进入这里'} />
      )}
    </div>
  )
}

function renderSummaryGrid(items: Array<[string, ReactNode]>) {
  return (
    <div className="warehouse-dispatch-summary-grid">
      {items.map(([label, value]) => (
        <div className="warehouse-dispatch-metric" key={label}>
          <span className="warehouse-dispatch-metric-value">{value}</span>
          <span className="warehouse-dispatch-metric-label">{label}</span>
        </div>
      ))}
    </div>
  )
}

function renderShippingBatchStatus(status?: string) {
  const normalized = String(status || '').toUpperCase()
  const meta = SHIPPING_BATCH_STATUS_META[normalized] || { label: status || '未知', color: 'default' }
  return <Tag color={meta.color}>{meta.label}</Tag>
}

function renderOutboundOrderStatus(status?: string) {
  const normalized = String(status || '').toUpperCase()
  const meta = OUTBOUND_ORDER_STATUS_META[normalized] || { label: status || '未知', color: 'default' }
  return <Tag color={meta.color}>{meta.label}</Tag>
}

function renderPackingListStatus(status?: string) {
  const normalized = String(status || '').toUpperCase()
  const meta = PACKING_LIST_STATUS_META[normalized] || { label: status || '未知', color: 'default' }
  return <Tag color={meta.color}>{meta.label}</Tag>
}

function shippingOptionLabel(option: ShippingSuggestionOption) {
  const forwarders = option.targetForwarderNames.length ? option.targetForwarderNames.join(' + ') : option.optionName
  const recommended = option.autoRecommended ? ' / 推荐' : ''
  return `${forwarders}${recommended}`
}

function renderShippingOptionCard(option: ShippingSuggestionOption) {
  return (
    <div className="warehouse-dispatch-route-card" key={option.id}>
      <div className="warehouse-dispatch-route-title">
        <span>{shippingOptionLabel(option)}</span>
        {option.selectedFlag ? <Tag color="green">当前物流计划</Tag> : option.autoRecommended ? <Tag color="blue">推荐</Tag> : null}
      </div>
      <div className="warehouse-dispatch-route-meta">
        空运 {option.airQuantity} 件 / 海运 {option.seaQuantity} 件 / 共 {option.totalQuantity} 件
      </div>
      <div className="warehouse-dispatch-route-meta">
        {option.estimatedTotalAmount !== undefined ? `${option.currency || ''} ${option.estimatedTotalAmount}` : '暂无预估费用'}
      </div>
      {option.blockedReasons.length ? (
        <div className="warehouse-dispatch-route-meta">
          <Tag color="red">{option.blockedReasons[0]}</Tag>
        </div>
      ) : null}
    </div>
  )
}

function renderPackingListSummary(packingLists: PackingList[]) {
  if (!packingLists.length) {
    return <Text type="secondary">未提交</Text>
  }
  return (
    <Space direction="vertical" size={2}>
      {packingLists.map((packingList) => (
        <Space key={packingList.id} size={4}>
          <Text strong>{packingList.packingNo || packingList.id}</Text>
          {renderPackingListStatus(packingList.status)}
          <Text type="secondary">{packingList.boxCount} 箱 / {packingList.packedQuantity} 件</Text>
        </Space>
      ))}
    </Space>
  )
}
