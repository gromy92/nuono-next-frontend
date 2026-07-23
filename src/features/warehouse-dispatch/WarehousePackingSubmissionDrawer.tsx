import { Drawer, Empty, Image, Space, Tag, Typography } from 'antd'
import { useMemo } from 'react'
import type { OutboundOrder, OutboundOrderLine, PackingBox, PackingList, ShippingBatch } from './types'
import {
  formatBoxSpec,
  formatWeight,
  packingGroupLabel,
  packingListSubmittedAt,
  routeLabel,
  sumPackingLists
} from './shippingExecutionDomain'
import { renderOutboundOrderStatus, renderPackingListStatus } from './WarehousePackingListView'

const { Text, Title } = Typography

type Props = {
  open: boolean
  batch?: ShippingBatch
  outboundOrders: OutboundOrder[]
  packingListsByOutboundOrder: Record<string, PackingList[]>
  focusOutboundOrderId?: string
  loading: boolean
  onClose: () => void
}

export function WarehousePackingSubmissionDrawer({
  open,
  batch,
  outboundOrders,
  packingListsByOutboundOrder,
  focusOutboundOrderId,
  loading,
  onClose
}: Props) {
  const visibleOrders = focusOutboundOrderId
    ? outboundOrders.filter((order) => order.id === focusOutboundOrderId)
    : outboundOrders
  const visiblePackingLists = visibleOrders.flatMap((order) => packingListsByOutboundOrder[order.id] || [])
  const totals = sumPackingLists(visiblePackingLists)
  const submittedAt = packingListSubmittedAt(visiblePackingLists)

  return (
    <Drawer className="warehouse-shipping-execution-drawer" width="min(960px, 94vw)" open={open}
      title="APP 装箱详情" onClose={onClose} destroyOnClose>
      {batch ? (
        <>
          <div className="warehouse-shipping-execution-summary">
            <div>
              <Title level={4}>{batch.batchNo || batch.id}</Title>
              <Text type="secondary">APP 提交后进入物流交接，实际交给货代后再完成发货。</Text>
            </div>
            <div className="warehouse-shipping-execution-metrics">
              <ExecutionMetric label="发货单" value={`${visibleOrders.length} 张`} />
              <ExecutionMetric label="箱数" value={`${totals.boxCount} 箱`} />
              <ExecutionMetric label="商品" value={`${totals.packedQuantity} 件`} />
              <ExecutionMetric label="总毛重" value={formatWeight(totals.grossWeightKg)} />
              <ExecutionMetric label="总体积" value={`${totals.volumeCbm.toFixed(4)} m³`} />
              <ExecutionMetric label="APP 提交时间" value={submittedAt || '尚未提交'} />
            </div>
          </div>
          <div className="warehouse-shipping-execution-orders">
            {visibleOrders.map((order) => (
              <ShippingOrderSubmission key={order.id} order={order}
                packingLists={packingListsByOutboundOrder[order.id] || []} />
            ))}
            {!visibleOrders.length && !loading ? <Empty description="暂无发货执行内容" /> : null}
          </div>
        </>
      ) : <Empty description="请选择发货批次" />}
    </Drawer>
  )
}

function ShippingOrderSubmission({ order, packingLists }: {
  order: OutboundOrder
  packingLists: PackingList[]
}) {
  const lineById = useMemo(
    () => new Map(order.lines.map((line) => [line.id, line])),
    [order.lines]
  )
  return (
    <section className="warehouse-shipping-execution-order">
      <header>
        <div>
          <Space size={8} wrap>
            <Title level={5}>{order.outboundNo || order.id}</Title>
            {renderOutboundOrderStatus(order.status)}
          </Space>
          <Text type="secondary">
            {order.originName || '来源未维护'} · {order.skuCount} PSKU · {order.totalQuantity} 件
          </Text>
        </div>
      </header>
      {packingLists.map((packingList) => (
        <div className="warehouse-shipping-execution-packing" key={packingList.id}>
          <div className="warehouse-shipping-execution-packing-title">
            <Space size={8} wrap>
              <Text strong>{packingList.packingNo || packingList.id}</Text>
              {renderPackingListStatus(packingList.status)}
            </Space>
            <Text type="secondary">
              {packingList.boxCount} 箱 · {packingList.packedQuantity} 件 · {packingList.updatedAt || packingList.createdAt}
            </Text>
          </div>
          <div className="warehouse-shipping-execution-boxes">
            {packingList.boxes.map((box) => (
              <ShippingBox key={box.id} box={box} lineById={lineById} />
            ))}
            {!packingList.boxes.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="尚无箱明细" /> : null}
          </div>
        </div>
      ))}
      {!packingLists.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="尚无装箱单" /> : null}
    </section>
  )
}

function ShippingBox({ box, lineById }: {
  box: PackingBox
  lineById: Map<string, OutboundOrderLine>
}) {
  const firstLine = lineById.get(box.items[0]?.outboundOrderLineId || '')
  return (
    <article className="warehouse-shipping-execution-box">
      <div className="warehouse-shipping-execution-box-title">
        <div>
          <Space size={8} wrap>
            <Text strong>{box.boxNo}</Text>
            <Tag color="blue">{packingGroupLabel(firstLine)}</Tag>
          </Space>
          {routeLabel(firstLine) ? <Text type="secondary">{routeLabel(firstLine)}</Text> : null}
        </div>
        <Text type="secondary">
          {formatBoxSpec(box)} · {formatWeight(box.grossWeightKg)} · {box.quantity} 件
        </Text>
      </div>
      <div className="warehouse-shipping-execution-products">
        {box.items.map((item) => {
          const line = lineById.get(item.outboundOrderLineId)
          const source = line?.sources[0]
          return (
            <div className="warehouse-shipping-execution-product" key={item.id}>
              {line?.imageUrl
                ? <Image width={48} height={48} preview={false} src={line.imageUrl} />
                : <div className="warehouse-shipping-execution-image-placeholder">无图</div>}
              <div className="warehouse-shipping-execution-product-main">
                <Text strong>{item.partnerSku || line?.psku || 'PSKU 缺失'}</Text>
                <Text type="secondary" ellipsis>{line?.title || '商品名称缺失'}</Text>
                <Text type="secondary">
                  {[line?.storeCode, line?.siteCode, source?.purchaseOrderNo].filter(Boolean).join(' · ')}
                </Text>
              </div>
              <Text strong>{item.quantity} 件</Text>
            </div>
          )
        })}
      </div>
    </article>
  )
}

function ExecutionMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="warehouse-shipping-execution-metric">
      <Text type="secondary">{label}</Text>
      <Text strong>{value}</Text>
    </div>
  )
}
