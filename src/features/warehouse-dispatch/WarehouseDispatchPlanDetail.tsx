import { CheckCircleOutlined } from '@ant-design/icons'
import { Button, Empty, Modal, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { sumPlanQuantity } from './dispatchPlanDomain'
import { formatShippingOptionAmount } from './shippingCostDomain'
import type { DispatchPlanLine, RouteGroup, WarehouseSiteCode } from './types'
import type { useShippingPlanWorkspace } from './useShippingPlanWorkspace'
import {
  renderDispatchStatus,
  renderFulfillmentType,
  renderSpecStatus,
  renderTransportMode
} from './WarehouseDispatchSharedView'
import {
  DISPATCH_PLAN_LINE_TABLE_PAGINATION,
  SITE_LABELS,
  TRANSPORT_LABELS
} from './workbenchModels'

const { Text } = Typography

export function WarehouseDispatchPlanDetail({
  workspace,
  dataLoading
}: {
  workspace: ReturnType<typeof useShippingPlanWorkspace>
  dataLoading: boolean
}) {
  const plan = workspace.selectedPlan
  const columns: ColumnsType<DispatchPlanLine> = [
    {
      title: 'PSKU',
      dataIndex: 'psku',
      render: (_, line) => (
        <Space direction="vertical" size={0}>
          <Text strong>{line.psku}</Text>
          <Text type="secondary">{line.title}</Text>
        </Space>
      )
    },
    { title: '总数量', dataIndex: 'totalQuantity' },
    { title: '站点', dataIndex: 'siteCode',
      render: (site: WarehouseSiteCode) => <Tag color="blue">{site}</Tag> },
    { title: '运输', dataIndex: 'transportMode', render: renderTransportMode },
    { title: '履约', render: (_, line) => renderFulfillmentType(line.fulfillmentType) },
    {
      title: '来源分摊',
      render: (_, line) => (
        <div className="warehouse-dispatch-source-list">
          {line.sources.map((source) => (
            <div key={`${source.sourceItemId}-${source.quantity}`}>
              {source.orderNo} / {source.storeName}: {source.quantity}
            </div>
          ))}
        </div>
      )
    },
    { title: '规格', dataIndex: 'specStatus', render: renderSpecStatus }
  ]
  return (
    <Modal className="warehouse-dispatch-plan-detail-modal"
      title={plan ? `${plan.planNo} 发货申请单详情` : '发货申请单详情'}
      open={workspace.detailOpen} width="min(1520px, 96vw)" footer={null}
      onCancel={() => workspace.setDetailOpen(false)}>
      {plan ? (
        <div className="warehouse-dispatch-plan-detail is-modal">
          <div className="warehouse-dispatch-detail-header">
            <Space size={8} wrap>
              <Text strong>商品明细</Text>
              {renderDispatchStatus(plan.status)}
              {workspace.shippingBatch ? <Tag color="blue">{workspace.shippingBatch.batchNo}</Tag> : null}
              <Tag>{sumPlanQuantity(plan)} 件</Tag>
              <Tag>{plan.lines.length} PSKU</Tag>
            </Space>
            {plan.currentShippingBatch && workspace.batchLoadingId === plan.currentShippingBatch.id
              ? <Tag color="processing">物流方案加载中</Tag>
              : null}
          </div>
          {workspace.shippingBatch && workspace.shippingBatch.status !== 'OUTBOUND_CREATED'
            ? <ShippingSelection workspace={workspace} />
            : null}
          <div className={`warehouse-dispatch-plan-layout${workspace.shippingBatch ? ' is-generated' : ''}`}>
            <Table rowKey="id" size="small" columns={columns} dataSource={plan.lines}
              loading={dataLoading} pagination={DISPATCH_PLAN_LINE_TABLE_PAGINATION}
              locale={{ emptyText: <Empty description="当前发货申请单还没有商品" /> }} />
            {!workspace.shippingBatch ? (
              <div className="warehouse-dispatch-route-list">
                <div className="warehouse-dispatch-route-list-title">申请单物流分组</div>
                {workspace.routeGroups.length
                  ? workspace.routeGroups.map((group) => <RouteGroupCard key={group.key} group={group}
                    selected={group.key === workspace.selectedRouteGroupKey}
                    onSelect={workspace.setSelectedRouteGroupKey} />)
                  : <Empty description="暂无物流分组" />}
              </div>
            ) : null}
          </div>
        </div>
      ) : <Empty description="暂无发货申请单" />}
    </Modal>
  )
}

function ShippingSelection({ workspace }: { workspace: ReturnType<typeof useShippingPlanWorkspace> }) {
  const option = workspace.selectedOption
  const batch = workspace.shippingBatch
  if (!batch) return null
  return (
    <div className="warehouse-dispatch-shipping-selection-bar">
      <div className="warehouse-dispatch-shipping-selection-control">
        <Text strong>提交物流方案</Text>
        <Select className="warehouse-dispatch-shipping-option-select" aria-label="提交物流方案"
          value={workspace.selectedOptionId} placeholder="请选择最终提交方案"
          options={batch.options.map((item) => ({ value: item.id,
            label: `${item.optionName} · ${formatShippingOptionAmount(item)}` }))}
          onChange={workspace.setSelectedOptionId} />
        {option ? option.warningCount > 0 || option.blockedReasons.length > 0
          ? <Tag color="gold">需复核</Tag>
          : <Tag color="green">可提交</Tag> : null}
        {option ? <Text className="warehouse-dispatch-shipping-option-amount" strong>
          {formatShippingOptionAmount(option)}
        </Text> : null}
      </div>
      <Button type="primary" ghost icon={<CheckCircleOutlined />}
        disabled={!workspace.selectedOptionId} loading={workspace.outboundSubmitting}
        onClick={() => { void workspace.confirmOutbound() }}>
        确认物流并下发发货单
      </Button>
    </div>
  )
}

function RouteGroupCard({ group, selected, onSelect }: {
  group: RouteGroup
  selected: boolean
  onSelect: (key: string) => void
}) {
  return (
    <button type="button" className={`warehouse-dispatch-route-card${selected ? ' is-selected' : ''}`}
      onClick={() => onSelect(group.key)}>
      <div className="warehouse-dispatch-route-title">
        <span>{SITE_LABELS[group.siteCode]} {TRANSPORT_LABELS[group.transportMode]}</span>
        {selected ? <Tag color="blue">已选择</Tag>
          : group.issueCount > 0 ? <Tag color="gold">需处理</Tag> : <Tag color="green">可生成</Tag>}
      </div>
      <div className="warehouse-dispatch-route-meta">商品 {group.lineCount} 个，数量 {group.totalQuantity}</div>
      <div className="warehouse-dispatch-route-meta">拆分规则：站点 + 运输方式 + 发货仓库 + 货物属性</div>
    </button>
  )
}
