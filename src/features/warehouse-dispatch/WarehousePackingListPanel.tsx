import { DownloadOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Empty, Space, Table, Typography, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { loadOutboundOrders, loadPackingLists, loadShippingBatches } from './api'
import {
  matchesLogisticsPartition,
  summarizeLogisticsPartitionValues
} from './logisticsPartitionDomain'
import type {
  LogisticsSiteFilter,
  LogisticsTransportFilter
} from './logisticsPartitionDomain'
import { LogisticsPartitionFilters, LogisticsPartitionTags } from './LogisticsPartitionViews'
import type { PackingBatchDetails } from './packingExportDomain'
import { mergeBatchOutboundOrder } from './shippingExecutionDomain'
import type { OutboundOrder, PackingList, ShippingBatch } from './types'
import { usePackingListExport } from './usePackingListExport'
import { WarehousePackingExportModal } from './WarehousePackingExportModal'
import { renderShippingBatchStatus } from './WarehousePackingListView'
import { WarehousePackingSubmissionDrawer } from './WarehousePackingSubmissionDrawer'

const { Text } = Typography

const PAGINATION = {
  pageSize: 30,
  showSizeChanger: true,
  pageSizeOptions: [20, 30, 50],
  showTotal: (total: number) => `共 ${total} 张发货单`,
  size: 'small' as const
}

export function WarehousePackingListPanel() {
  const [shippingBatches, setShippingBatches] = useState<ShippingBatch[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState<string>()
  const [outboundOrdersByBatch, setOutboundOrdersByBatch] = useState<Record<string, OutboundOrder[]>>({})
  const [packingListsByOutboundOrder, setPackingListsByOutboundOrder] = useState<Record<string, PackingList[]>>({})
  const [loading, setLoading] = useState(false)
  const [detailLoadingBatchId, setDetailLoadingBatchId] = useState<string>()
  const [loadError, setLoadError] = useState<string>()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [siteFilter, setSiteFilter] = useState<LogisticsSiteFilter>('all')
  const [transportFilter, setTransportFilter] = useState<LogisticsTransportFilter>('all')
  const packingExport = usePackingListExport(loadBatchDetails)
  const filteredBatches = useMemo(() => shippingBatches.filter((batch) => (
    matchesLogisticsPartition(batchPartition(batch), siteFilter, transportFilter)
  )), [shippingBatches, siteFilter, transportFilter])

  const selectedBatch = useMemo(
    () => shippingBatches.find((batch) => batch.id === selectedBatchId),
    [selectedBatchId, shippingBatches]
  )
  const selectedOutboundOrders = selectedBatch ? outboundOrdersByBatch[selectedBatch.id] || [] : []
  const selectedPackingLists = selectedOutboundOrders.flatMap((order) => packingListsByOutboundOrder[order.id] || [])
  const displayOutboundOrder = selectedBatch
    ? mergeBatchOutboundOrder(selectedBatch, selectedOutboundOrders)
    : undefined
  const displayOutboundOrders = displayOutboundOrder ? [displayOutboundOrder] : []
  const displayPackingListsByOrder = displayOutboundOrder
    ? { [displayOutboundOrder.id]: selectedPackingLists }
    : {}

  useEffect(() => {
    void refreshPackingLists()
  }, [])

  async function refreshPackingLists() {
    setLoading(true)
    setLoadError(undefined)
    try {
      const nextBatches = await loadShippingBatches()
      setShippingBatches(nextBatches)
      setOutboundOrdersByBatch({})
      setPackingListsByOutboundOrder({})
      setSelectedBatchId(undefined)
      setDrawerOpen(false)
    } catch (error) {
      const messageText = error instanceof Error ? error.message : '发货单读取失败'
      setLoadError(messageText)
      message.error(messageText)
    } finally {
      setLoading(false)
    }
  }

  async function loadBatchDetails(batchId: string): Promise<PackingBatchDetails> {
    const cachedOrders = outboundOrdersByBatch[batchId]
    if (cachedOrders) {
      return {
        outboundOrders: cachedOrders,
        packingListsByOutboundOrder: Object.fromEntries(
          cachedOrders.map((order) => [order.id, packingListsByOutboundOrder[order.id] || []])
        )
      }
    }
    const outboundOrders = await loadOutboundOrders(batchId)
    const packingEntries = await Promise.all(
      outboundOrders.map(async (order) => [order.id, await loadPackingLists(order.id)] as const)
    )
    const nextPackingLists = Object.fromEntries(packingEntries)
    setOutboundOrdersByBatch((current) => ({ ...current, [batchId]: outboundOrders }))
    setPackingListsByOutboundOrder((current) => ({
      ...current,
      ...nextPackingLists
    }))
    return { outboundOrders, packingListsByOutboundOrder: nextPackingLists }
  }

  async function openPackingDetails(batch: ShippingBatch) {
    setSelectedBatchId(batch.id)
    if (!Object.prototype.hasOwnProperty.call(outboundOrdersByBatch, batch.id)) {
      setDetailLoadingBatchId(batch.id)
      try {
        await loadBatchDetails(batch.id)
      } catch (error) {
        message.error(error instanceof Error ? error.message : '装箱详情读取失败')
        return
      } finally {
        setDetailLoadingBatchId(undefined)
      }
    }
    setDrawerOpen(true)
  }

  const columns: ColumnsType<ShippingBatch> = [
    {
      title: '发货单',
      dataIndex: 'batchNo',
      width: 210,
      render: (_value, batch) => (
        <Space direction="vertical" size={0}>
          <Text strong>{batch.batchNo || batch.id}</Text>
          <Text type="secondary">{batch.createdAt || '-'}</Text>
        </Space>
      )
    },
    {
      title: '站点 / 运输方式',
      width: 190,
      render: (_value, batch) => <LogisticsPartitionTags summary={batchPartition(batch)} />
    },
    {
      title: '状态',
      width: 110,
      render: (_value, batch) => renderShippingBatchStatus(batch.status)
    },
    {
      title: '总体积',
      width: 120,
      align: 'right',
      render: (_value, batch) => actualMetric(batch.volumeCbm, 4, 'm³')
    },
    {
      title: '总毛重',
      width: 120,
      align: 'right',
      render: (_value, batch) => actualMetric(batch.grossWeightKg, 1, 'kg')
    },
    {
      title: '箱数',
      dataIndex: 'boxCount',
      width: 90,
      align: 'right',
      render: (value: number) => value > 0 ? `${value} 箱` : <Text type="secondary">待装箱</Text>
    },
    {
      title: '商品数',
      dataIndex: 'skuCount',
      width: 110,
      align: 'right',
      render: (value: number) => `${value} PSKU`
    },
    {
      title: '件数',
      dataIndex: 'totalQuantity',
      width: 100,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('zh-CN')} 件`
    },
    {
      title: '计划物流数',
      dataIndex: 'optionCount',
      width: 110,
      align: 'right',
      render: (value: number) => `${value} 个`
    },
    {
      title: '操作',
      width: 270,
      fixed: 'right',
      render: (_value, batch) => (
        <Space size={0}>
          <Button type="link" icon={<EyeOutlined />}
            loading={detailLoadingBatchId === batch.id}
            onClick={(event) => {
              event.stopPropagation()
              void openPackingDetails(batch)
            }}>
            查看装箱详情
          </Button>
          <Button type="link" icon={<DownloadOutlined />} disabled={batch.boxCount <= 0}
            loading={packingExport.loadingBatchId === batch.id}
            onClick={(event) => {
              event.stopPropagation()
              void packingExport.open(batch)
            }}>
            导出装箱单
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div className="warehouse-dispatch-panel">
      <div className="warehouse-dispatch-toolbar">
        <div className="warehouse-dispatch-toolbar-left">
          <Text strong>发货单</Text>
          <Text type="secondary">显示 {filteredBatches.length} / 共 {shippingBatches.length} 张</Text>
        </div>
        <Space size={8}>
          <LogisticsPartitionFilters siteFilter={siteFilter} transportFilter={transportFilter}
            onSiteFilterChange={setSiteFilter} onTransportFilterChange={setTransportFilter} />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void refreshPackingLists()}>
            刷新
          </Button>
        </Space>
      </div>
      <Table rowKey="id" size="small" columns={columns} dataSource={filteredBatches}
        loading={loading} pagination={PAGINATION} scroll={{ x: 1430 }}
        rowClassName="warehouse-dispatch-clickable-row"
        onRow={(batch) => ({ onClick: () => void openPackingDetails(batch) })}
        locale={{ emptyText: <Empty description={loadError || '暂无发货单'} /> }} />
      <WarehousePackingSubmissionDrawer open={drawerOpen} batch={selectedBatch}
        outboundOrders={displayOutboundOrders} packingListsByOutboundOrder={displayPackingListsByOrder}
        loading={Boolean(detailLoadingBatchId)} onClose={() => setDrawerOpen(false)} />
      <WarehousePackingExportModal batch={packingExport.targetBatch}
        channels={packingExport.channels} selection={packingExport.selection}
        loading={Boolean(packingExport.loadingBatchId)}
        onSelectionChange={packingExport.setSelection}
        onConfirm={() => void packingExport.confirm()} onClose={packingExport.close} />
    </div>
  )
}

function batchPartition(batch: ShippingBatch) {
  return summarizeLogisticsPartitionValues(batch.siteCodes, batch.transportModes)
}

function actualMetric(value: number | undefined, digits: number, unit: string) {
  return Number(value || 0) > 0
    ? `${Number(value).toFixed(digits)} ${unit}`
    : <Text type="secondary">待装箱</Text>
}
