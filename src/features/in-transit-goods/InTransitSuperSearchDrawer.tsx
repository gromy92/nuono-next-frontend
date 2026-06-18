import { Button, Checkbox, Drawer, Empty, Input, Select, Space, Table, Tag, Typography } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { InTransitBatch, InTransitSuperSearchItem } from './types'
import type { useInTransitSuperSearch } from './useInTransitSuperSearch'
import { InTransitProductThumb } from './InTransitProductThumb'
import {
  formatInTransitDuration,
  formatNodeDate,
  formatNodeDateTime,
  formatQuantity,
  logisticsNodeDisplayLabel,
  nodeTimelineColor
} from './InTransitGoodsPage.utils'

const { Text } = Typography

type InTransitSuperSearchDrawerProps = {
  search: ReturnType<typeof useInTransitSuperSearch>
  storeOptions: Array<{ label: string; value: string }>
  statusLabel: Map<string, string>
  transportLabel: Map<string, string>
  nodeStatusLabel: Map<string, string>
  formatDestination: (code?: string | null) => string
  onOpenBatch: (batch: InTransitBatch) => void
}

export function InTransitSuperSearchDrawer({
  search,
  storeOptions,
  statusLabel,
  transportLabel,
  nodeStatusLabel,
  formatDestination,
  onOpenBatch
}: InTransitSuperSearchDrawerProps) {
  const rows = search.state.result?.items ?? []
  const columns: ColumnsType<InTransitSuperSearchItem> = [
    {
      title: '商品',
      key: 'product',
      fixed: 'left',
      width: 300,
      render: (_value, row) => (
        <Space size={10} align="start" className="in-transit-super-search__product">
          <InTransitProductThumb imageUrl={row.productImageUrl} title={productTitle(row)} loading="eager" />
          <Space direction="vertical" size={2}>
            <Text strong>{row.psku}</Text>
            <Text>{productTitle(row)}</Text>
            {row.productTitle && row.productTitle !== productTitle(row) ? (
              <Text type="secondary">{row.productTitle}</Text>
            ) : null}
          </Space>
        </Space>
      )
    },
    {
      title: '在途批次',
      key: 'batch',
      width: 230,
      render: (_value, row) => (
        <Space direction="vertical" size={2}>
          <Button type="link" className="in-transit-batch-cell__box-link" onClick={() => onOpenBatch(batchFromSearchItem(row))}>
            {row.batchReferenceNo || `#${row.batchId}`}
          </Button>
          <Text type="secondary">目的地 {formatDestination(row.targetStoreCode)}</Text>
          <Space size={6} wrap>
            <Tag color={row.transportMode === 'AIR' ? 'blue' : 'cyan'} style={{ marginInlineEnd: 0 }}>
              {transportLabel.get(row.transportMode || '') || row.transportMode || '-'}
            </Tag>
            <Tag color={row.batchStatus === 'exception' ? 'red' : 'purple'} style={{ marginInlineEnd: 0 }}>
              {statusLabel.get(row.batchStatus || '') || row.batchStatus || '-'}
            </Tag>
          </Space>
        </Space>
      )
    },
    {
      title: '货代/仓',
      key: 'forwarder',
      width: 180,
      render: (_value, row) => (
        <Space direction="vertical" size={2}>
          <Text>{row.standardForwarderName || row.rawForwarderName || '-'}</Text>
          <Text type="secondary">{row.targetWarehouseName || '-'}</Text>
        </Space>
      )
    },
    {
      title: '数量',
      key: 'quantity',
      width: 180,
      render: (_value, row) => (
        <Space direction="vertical" size={2}>
          <Text type="secondary">发货 {formatQuantity(row.shippedQuantityTotal)}</Text>
          <Text type="secondary">入仓 {formatQuantity(row.receivedQuantityTotal)}</Text>
          <Text>剩余 {formatQuantity(row.remainingQuantityTotal)}</Text>
        </Space>
      )
    },
    {
      title: '时间',
      key: 'time',
      width: 300,
      render: (_value, row) => (
        <Space direction="vertical" size={2}>
          <Text type="secondary">箱单创建 {formatNodeDate(row.sourceCreatedAt)}</Text>
          <Text type="secondary">国内收货 {formatNodeDateTime(row.domesticReceivedAt)}</Text>
          <Text>{formatInTransitDuration(row.domesticReceivedAt)}</Text>
          <Text type="secondary">预计到仓 {row.etaDate || '-'}</Text>
          <Space size={6} wrap>
            <Text type="secondary">最新</Text>
            {row.latestNodeStatus ? (
              <Tag color={nodeTimelineColor(row.latestNodeStatus)} style={{ marginInlineEnd: 0 }}>
                {logisticsNodeDisplayLabel(nodeStatusLabel, row.latestNodeStatus, row.latestNodeDescription)}
              </Tag>
            ) : (
              <Text type="secondary">-</Text>
            )}
            <Text type="secondary">{formatNodeDate(row.latestNodeHappenedAt)}</Text>
          </Space>
        </Space>
      )
    }
  ]

  return (
    <Drawer
      title="在途超级搜索"
      width={1320}
      open={search.open}
      onClose={search.closePanel}
      destroyOnClose={false}
    >
      <Space direction="vertical" size={14} className="in-transit-super-search">
        <Space.Compact className="in-transit-super-search__bar">
          <Select
            allowClear
            className="in-transit-super-search__store-select"
            placeholder="全部店铺"
            options={storeOptions}
            value={search.projectCode}
            onChange={(value) => {
              search.setProjectCode(value)
              if (search.keyword.trim()) {
                void search.search(search.keyword, search.includeHistory, value)
              }
            }}
          />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="PSKU / 中文标题 / 英文标题"
            value={search.keyword}
            onChange={(event) => search.setKeyword(event.target.value)}
            onPressEnter={() => void search.search()}
          />
          <Button type="primary" icon={<SearchOutlined />} loading={search.state.status === 'loading'} onClick={() => void search.search()}>
            搜索
          </Button>
        </Space.Compact>
        <Checkbox
          checked={search.includeHistory}
            onChange={(event) => {
            search.setIncludeHistory(event.target.checked)
            if (search.keyword.trim()) {
              void search.search(search.keyword, event.target.checked, search.projectCode)
            }
          }}
        >
          包含历史
        </Checkbox>
        {search.state.status === 'success' && !rows.length ? <Empty description="没有找到在途批次" /> : null}
        <Table
          rowKey={(row) => `${row.batchId}-${row.psku}`}
          columns={columns}
          dataSource={rows}
          loading={search.state.status === 'loading'}
          pagination={false}
          size="small"
          scroll={{ x: 1190 }}
        />
      </Space>
    </Drawer>
  )
}

function productTitle(row: InTransitSuperSearchItem) {
  return row.productTitleCn?.trim() || row.productName?.trim() || row.productTitle?.trim() || row.psku
}

function batchFromSearchItem(row: InTransitSuperSearchItem): InTransitBatch {
  return {
    batchId: row.batchId,
    batchReferenceNo: row.batchReferenceNo,
    rawForwarderName: row.rawForwarderName,
    standardForwarderName: row.standardForwarderName,
    transportMode: row.transportMode,
    batchStatus: row.batchStatus,
    targetStoreCode: row.targetStoreCode,
    targetSiteCode: row.targetSiteCode,
    targetWarehouseName: row.targetWarehouseName,
    createdAt: row.sourceCreatedAt,
    domesticReceivedAt: row.domesticReceivedAt,
    latestNodeHappenedAt: row.latestNodeHappenedAt,
    latestNodeStatus: row.latestNodeStatus,
    latestNodeDescription: row.latestNodeDescription,
    etaDate: row.etaDate,
    boxCount: row.boxCount,
    skuCount: 1,
    shippedQuantityTotal: row.shippedQuantityTotal,
    receivedQuantityTotal: row.receivedQuantityTotal,
    remainingQuantityTotal: row.remainingQuantityTotal
  }
}
