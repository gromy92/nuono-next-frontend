import { useEffect, useState } from 'react'
import { Button, Card, Select, Space, Tabs, Tag } from 'antd'
import { fetchLogisticsQuoteOperationPriceItems } from '../api'
import { buildMockOperationPriceItemsResponse } from '../operationQuoteMockData'
import { buildOperationQuoteView } from '../operationQuoteModels'
import type {
  LogisticsQuoteOperationPriceItemDto,
  LogisticsQuoteOperationPriceItemsResponse
} from '../types'
import { OperationPriceAdjustmentModal } from './OperationPriceAdjustmentModal'
import { OperationQuoteFeeItemTable } from './OperationQuoteFeeItemTable'
import { OperationQuotePriceTierTable } from './OperationQuotePriceTierTable'

type PriceItemsState =
  | { status: 'loading' }
  | { status: 'success'; data: LogisticsQuoteOperationPriceItemsResponse }
  | { status: 'error'; message: string }

type SelectOption = {
  label: string
  value: string
}

function uniqueOptions(items: LogisticsQuoteOperationPriceItemDto[], resolve: (item: LogisticsQuoteOperationPriceItemDto) => SelectOption | null) {
  const optionMap = new Map<string, SelectOption>()
  items.forEach((item) => {
    const option = resolve(item)
    if (option && !optionMap.has(option.value)) {
      optionMap.set(option.value, option)
    }
  })
  return Array.from(optionMap.values())
}

function forwarderKey(item: LogisticsQuoteOperationPriceItemDto) {
  return String(item.forwarderId ?? item.forwarderName ?? '')
}

function versionKey(item: LogisticsQuoteOperationPriceItemDto) {
  return String(item.quoteVersionId ?? item.quoteVersionNo ?? '')
}

export function OperationPriceMaintenanceSection() {
  const [activeTabKey, setActiveTabKey] = useState('price-tiers')
  const [reloadKey, setReloadKey] = useState(0)
  const [state, setState] = useState<PriceItemsState>({ status: 'loading' })
  const [selectedForwarderKey, setSelectedForwarderKey] = useState<string>()
  const [selectedVersionKey, setSelectedVersionKey] = useState<string>()
  const [selectedTransportMode, setSelectedTransportMode] = useState<string>()
  const [editingItem, setEditingItem] = useState<LogisticsQuoteOperationPriceItemDto | null>(null)
  const [lastSaveMessage, setLastSaveMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadPriceItems = async () => {
      setState({ status: 'loading' })
      try {
        const data = await fetchLogisticsQuoteOperationPriceItems()
        if (!cancelled) {
          setState({ status: 'success', data })
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : '运营报价维护列表加载失败'
          setState({
            status: 'success',
            data: buildMockOperationPriceItemsResponse('ALL', message)
          })
        }
      }
    }

    void loadPriceItems()

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const data = state.status === 'success' ? state.data : null
  const allItems = data?.items ?? []
  const forwarderOptions = uniqueOptions(allItems, (item) =>
    item.forwarderName ? { label: item.forwarderName, value: forwarderKey(item) } : null
  )
  const versionOptions = uniqueOptions(
    allItems.filter((item) => !selectedForwarderKey || forwarderKey(item) === selectedForwarderKey),
    (item) => item.quoteVersionNo ? { label: item.quoteVersionNo, value: versionKey(item) } : null
  )
  const transportOptions = uniqueOptions(
    allItems.filter((item) =>
      (!selectedForwarderKey || forwarderKey(item) === selectedForwarderKey) &&
      (!selectedVersionKey || versionKey(item) === selectedVersionKey) &&
      (item.transportMode === 'AIR' || item.transportMode === 'SEA')
    ),
    (item) => item.transportMode ? { label: item.transportMode === 'AIR' ? '空运' : '海运', value: item.transportMode } : null
  )

  useEffect(() => {
    if (!allItems.length) {
      return
    }

    const nextForwarderOptions = uniqueOptions(allItems, (item) =>
      item.forwarderName ? { label: item.forwarderName, value: forwarderKey(item) } : null
    )
    setSelectedForwarderKey((current) =>
      current && nextForwarderOptions.some((option) => option.value === current)
        ? current
        : nextForwarderOptions[0]?.value
    )
  }, [data])

  useEffect(() => {
    if (!selectedForwarderKey) {
      return
    }
    const nextVersionOptions = uniqueOptions(
      allItems.filter((item) => forwarderKey(item) === selectedForwarderKey),
      (item) => item.quoteVersionNo ? { label: item.quoteVersionNo, value: versionKey(item) } : null
    )
    setSelectedVersionKey((current) =>
      current && nextVersionOptions.some((option) => option.value === current) ? current : nextVersionOptions[0]?.value
    )
  }, [allItems, selectedForwarderKey])

  useEffect(() => {
    if (!selectedVersionKey) {
      return
    }
    const nextTransportOptions = uniqueOptions(
      allItems.filter((item) =>
        (!selectedForwarderKey || forwarderKey(item) === selectedForwarderKey) &&
        versionKey(item) === selectedVersionKey &&
        (item.transportMode === 'AIR' || item.transportMode === 'SEA')
      ),
      (item) => item.transportMode ? { label: item.transportMode === 'AIR' ? '空运' : '海运', value: item.transportMode } : null
    )
    setSelectedTransportMode((current) =>
      current && nextTransportOptions.some((option) => option.value === current) ? current : nextTransportOptions[0]?.value
    )
  }, [allItems, selectedForwarderKey, selectedVersionKey])

  const selectedItems = allItems.filter((item) =>
    (!selectedForwarderKey || forwarderKey(item) === selectedForwarderKey) &&
    (!selectedVersionKey || versionKey(item) === selectedVersionKey) &&
    (!selectedTransportMode ||
      item.transportMode === selectedTransportMode ||
      item.targetType === 'WAREHOUSE_PROCESSING_FEE')
  )
  const viewModel = buildOperationQuoteView(selectedItems)
  const canAdjust = data?.mode === 'local-db'
  const loading = state.status === 'loading'
  const emptyText = state.status === 'error' ? state.message : '当前没有可维护的报价明细'

  return (
    <Card
      title="货代报价维护"
      bordered={false}
      style={{ boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}
      extra={
        <Space wrap size={8}>
          {data?.mode === 'mock-demo' ? <Tag color="warning">样例数据</Tag> : null}
          {lastSaveMessage ? <Tag color="success">{lastSaveMessage}</Tag> : null}
          <Button onClick={() => setReloadKey((current) => current + 1)}>刷新</Button>
        </Space>
      }
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Space wrap size={8}>
          <Select
            value={selectedForwarderKey}
            options={forwarderOptions}
            placeholder="选择货代"
            style={{ width: 220 }}
            loading={loading}
            onChange={(value) => {
              setSelectedForwarderKey(value)
              setSelectedVersionKey(undefined)
              setSelectedTransportMode(undefined)
            }}
          />
          <Select
            value={selectedVersionKey}
            options={versionOptions}
            placeholder="选择报价版本"
            style={{ width: 240 }}
            loading={loading}
            onChange={(value) => {
              setSelectedVersionKey(value)
              setSelectedTransportMode(undefined)
            }}
          />
          <Select
            value={selectedTransportMode}
            options={transportOptions}
            placeholder="选择运输方式"
            style={{ width: 160 }}
            loading={loading}
            onChange={setSelectedTransportMode}
          />
        </Space>

        <Tabs
          activeKey={activeTabKey}
          onChange={setActiveTabKey}
          items={[
            {
              key: 'price-tiers',
              label: `价格档 (${viewModel.priceTiers.length})`,
              children: (
                <OperationQuotePriceTierTable
                  rows={viewModel.priceTiers}
                  loading={loading}
                  canAdjust={canAdjust}
                  emptyText={emptyText}
                  onAdjust={setEditingItem}
                />
              )
            },
            {
              key: 'fee-items',
              label: `费用项 (${viewModel.feeItems.length})`,
              children: (
                <OperationQuoteFeeItemTable
                  rows={viewModel.feeItems}
                  loading={loading}
                  canAdjust={canAdjust}
                  emptyText={emptyText}
                  onAdjust={setEditingItem}
                />
              )
            }
          ]}
        />

        <OperationPriceAdjustmentModal
          item={editingItem}
          onCancel={() => setEditingItem(null)}
          onSaved={(message) => {
            setLastSaveMessage(message)
            setEditingItem(null)
            setReloadKey((current) => current + 1)
          }}
        />
      </Space>
    </Card>
  )
}
