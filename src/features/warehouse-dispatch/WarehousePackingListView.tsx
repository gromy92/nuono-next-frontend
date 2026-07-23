import { Space, Tag, Typography } from 'antd'
import type { PackingList, ShippingSuggestionOption } from './types'

const { Text } = Typography

const SHIPPING_BATCH_STATUS_META: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '待物流计划', color: 'gold' },
  OPTION_SELECTED: { label: '已给出物流计划', color: 'blue' },
  OUTBOUND_CREATED: { label: '已生成发货单', color: 'purple' },
  PACKING: { label: 'APP 装箱中', color: 'processing' },
  PACKED: { label: '待物流交接', color: 'cyan' },
  SHIPPED: { label: '已发货', color: 'green' }
}

const OUTBOUND_ORDER_STATUS_META: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '待装箱', color: 'gold' },
  PACKING: { label: 'APP 装箱中', color: 'processing' },
  PACKED: { label: 'APP 已提交', color: 'cyan' },
  SHIPPED: { label: '已发货', color: 'green' }
}

const PACKING_LIST_STATUS_META: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'gold' },
  CONFIRMED: { label: 'APP 已提交', color: 'cyan' },
  SEALED: { label: 'APP 已提交', color: 'cyan' },
  SHIPPED: { label: '已发货', color: 'green' }
}

export function renderShippingBatchStatus(status?: string) {
  return statusTag(status, SHIPPING_BATCH_STATUS_META)
}

export function renderOutboundOrderStatus(status?: string) {
  return statusTag(status, OUTBOUND_ORDER_STATUS_META)
}

export function renderPackingListStatus(status?: string) {
  return statusTag(status, PACKING_LIST_STATUS_META)
}

export function renderShippingOptionCard(option: ShippingSuggestionOption) {
  const forwarders = option.targetForwarderNames.length
    ? option.targetForwarderNames.join(' + ')
    : option.optionName
  return (
    <div className="warehouse-dispatch-route-card" key={option.id}>
      <div className="warehouse-dispatch-route-title">
        <span>{forwarders}{option.autoRecommended ? ' / 推荐' : ''}</span>
        {option.selectedFlag
          ? <Tag color="green">当前物流计划</Tag>
          : option.autoRecommended ? <Tag color="blue">推荐</Tag> : null}
      </div>
      <div className="warehouse-dispatch-route-meta">
        空运 {option.airQuantity} 件 / 海运 {option.seaQuantity} 件 / 共 {option.totalQuantity} 件
      </div>
      <div className="warehouse-dispatch-route-meta">
        {option.estimatedTotalAmount !== undefined
          ? `${option.currency || ''} ${option.estimatedTotalAmount}`
          : '暂无预估费用'}
      </div>
      {option.blockedReasons.length ? (
        <div className="warehouse-dispatch-route-meta"><Tag color="red">{option.blockedReasons[0]}</Tag></div>
      ) : null}
    </div>
  )
}

export function renderPackingListSummary(packingLists: PackingList[]) {
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

function statusTag(status: string | undefined, metas: Record<string, { label: string; color: string }>) {
  const meta = metas[String(status || '').toUpperCase()] || { label: status || '未知', color: 'default' }
  return <Tag color={meta.color}>{meta.label}</Tag>
}
