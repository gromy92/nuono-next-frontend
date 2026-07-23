import { CalculatorOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Empty, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  buildPlanSiteTransportLabels,
  countPlanSourceOrders,
  countPlanStores,
  sumPlanQuantity
} from './dispatchPlanDomain'
import { formatDispatchPlanBatchMetric } from './shippingCostDomain'
import type { DispatchPlan } from './types'
import type { useShippingPlanWorkspace } from './useShippingPlanWorkspace'
import { renderDispatchStatus } from './WarehouseDispatchSharedView'
import { DISPATCH_PLAN_TABLE_PAGINATION } from './workbenchModels'

const { Text } = Typography

type WarehouseDispatchPlanPanelProps = {
  plans: DispatchPlan[]
  workspace: ReturnType<typeof useShippingPlanWorkspace>
  dataLoading: boolean
  dataError?: string
  onRefresh: () => Promise<unknown>
}

export function WarehouseDispatchPlanPanel({
  plans,
  workspace,
  dataLoading,
  dataError,
  onRefresh
}: WarehouseDispatchPlanPanelProps) {
  const columns: ColumnsType<DispatchPlan> = [
    {
      title: '发货申请单',
      dataIndex: 'planNo',
      width: 210,
      render: (_, plan) => (
        <Space direction="vertical" size={2}>
          <Space size={6} wrap><Text strong>{plan.planNo}</Text>{renderDispatchStatus(plan.status)}</Space>
          <Text type="secondary">{plan.createdAt || '-'}</Text>
        </Space>
      )
    },
    {
      title: '来源',
      width: 130,
      render: (_, plan) => (
        <Space direction="vertical" size={0}>
          <Text><Text strong>{countPlanSourceOrders(plan)}</Text> 张采购单</Text>
          <Text type="secondary">{countPlanStores(plan)} 个店铺</Text>
        </Space>
      )
    },
    {
      title: '商品',
      width: 110,
      render: (_, plan) => (
        <Space direction="vertical" size={0}>
          <Text><Text strong>{plan.lines.length}</Text> PSKU</Text>
          <Text type="secondary">{sumPlanQuantity(plan)} 件</Text>
        </Space>
      )
    },
    {
      title: '站点 / 运输方式',
      width: 160,
      render: (_, plan) => {
        const labels = buildPlanSiteTransportLabels(plan.lines)
        return labels.length
          ? <Space size={[4, 4]} wrap>{labels.map((label) => <Tag color="blue" key={label}>{label}</Tag>)}</Space>
          : <Text type="secondary">-</Text>
      }
    },
    {
      title: '物流计划',
      width: 210,
      render: (_, plan) => plan.currentShippingBatch ? (
        <Space direction="vertical" size={0}>
          <Text strong>{plan.currentShippingBatch.batchNo}</Text>
          <Text type="secondary">{plan.currentShippingBatch.optionCount} 个方案</Text>
        </Space>
      ) : <Text type="secondary">未生成</Text>
    },
    {
      title: '整批统计',
      width: 170,
      render: (_, plan) => (
        <Space direction="vertical" size={0}>
          <BatchMetric label="重量" metric={formatDispatchPlanBatchMetric(plan, 'weight')} />
          <BatchMetric label="体积" metric={formatDispatchPlanBatchMetric(plan, 'volume')} />
        </Space>
      )
    },
    {
      title: '操作',
      width: 130,
      render: (_, plan) => (
        <Space direction="vertical" size={0} align="start">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={(event) => {
            event.stopPropagation()
            workspace.selectPlan(plan.id)
          }}>查看明细</Button>
          {plan.currentShippingBatch ? (
            <Button type="link" size="small" icon={<CalculatorOutlined />}
              loading={workspace.batchLoadingId === plan.currentShippingBatch.id}
              disabled={plan.currentShippingBatch.optionCount <= 0}
              onClick={(event) => {
                event.stopPropagation()
                workspace.openCostComparison(plan)
              }}>费用对比</Button>
          ) : null}
        </Space>
      )
    }
  ]
  return (
    <div className="warehouse-dispatch-panel">
      <div className="warehouse-dispatch-toolbar">
        <div className="warehouse-dispatch-toolbar-left">
          <Text strong>发货申请单列表</Text>
          {dataError ? <Tag color="red">{dataError}</Tag> : null}
        </div>
        <div className="warehouse-dispatch-toolbar-right">
          <Button icon={<ReloadOutlined />} loading={dataLoading} onClick={() => { void onRefresh() }}>刷新</Button>
        </div>
      </div>
      <Table className="warehouse-dispatch-plan-table" rowKey="id" size="small" columns={columns}
        dataSource={plans} loading={dataLoading} pagination={DISPATCH_PLAN_TABLE_PAGINATION}
        scroll={{ x: 1120 }} rowClassName={(plan) => plan.id === workspace.selectedPlan?.id
          ? 'warehouse-dispatch-selected-row'
          : ''}
        locale={{ emptyText: <Empty description="暂无发货申请单，请先在仓管 APP 发起" /> }}
        onRow={(plan) => ({ onClick: () => workspace.selectPlan(plan.id) })} />
    </div>
  )
}

function BatchMetric({ label, metric }: {
  label: string
  metric: ReturnType<typeof formatDispatchPlanBatchMetric>
}) {
  return (
    <Space size={6}>
      <Text type="secondary">{label}</Text>
      {metric.status === 'missing'
        ? <Text type="warning">{metric.text}</Text>
        : metric.status === 'pending'
          ? <Text type="secondary">{metric.text}</Text>
          : metric.text}
    </Space>
  )
}
