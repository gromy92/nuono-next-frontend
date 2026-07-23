import { CheckCircleOutlined } from '@ant-design/icons'
import { Button, Drawer, Empty, Space, Tag, Typography } from 'antd'
import { formatShippingOptionAmount } from './shippingCostDomain'
import { ShippingCostBreakdown } from './ShippingCostBreakdown'
import { ShippingOptionComparison } from './ShippingOptionComparison'
import type { useShippingPlanWorkspace } from './useShippingPlanWorkspace'

const { Text } = Typography

export function WarehouseShippingCostDrawer({
  workspace
}: {
  workspace: ReturnType<typeof useShippingPlanWorkspace>
}) {
  const batch = workspace.shippingBatch
  const option = workspace.selectedOption
  return (
    <Drawer title="物流方案费用对比" rootClassName="warehouse-dispatch-cost-drawer-shell"
      open={workspace.costDrawerOpen} width="min(1480px, 96vw)"
      onClose={() => workspace.setCostDrawerOpen(false)}
      footer={batch ? (
        <div className="warehouse-dispatch-cost-drawer-footer">
          <div className="warehouse-dispatch-cost-drawer-selection">
            <Text type="secondary">{batch.status === 'OUTBOUND_CREATED' ? '已下发物流方案' : '最终物流方案'}</Text>
            {option ? (
              <Space size={8} wrap>
                <Text strong>{option.optionName}</Text>
                <Text>{formatShippingOptionAmount(option)}</Text>
                {batch.status === 'OUTBOUND_CREATED' ? <Tag>方案已锁定</Tag> : null}
                {option.warningCount > 0 || option.blockedReasons.length > 0
                  ? <Tag color="gold">需复核</Tag>
                  : <Tag color="green">可提交</Tag>}
              </Space>
            ) : <Text type="warning">尚未选择</Text>}
          </div>
          {batch.status !== 'OUTBOUND_CREATED' ? (
            <Button type="primary" icon={<CheckCircleOutlined />} disabled={!workspace.selectedOptionId}
              loading={workspace.outboundSubmitting} onClick={() => { void workspace.confirmOutbound() }}>
              确认物流并下发发货单
            </Button>
          ) : null}
        </div>
      ) : null}>
      {batch && workspace.costDetailOption ? (
        <div className="warehouse-dispatch-cost-drawer">
          <ShippingOptionComparison options={batch.options}
            selectedSubmissionOptionId={workspace.selectedOptionId}
            detailOptionId={workspace.costDetailOption.id}
            onView={workspace.setCostDetailOptionId}
            onSelect={workspace.selectOptionFromComparison}
            selectionLocked={batch.status === 'OUTBOUND_CREATED'} />
          <ShippingCostBreakdown option={workspace.costDetailOption} />
        </div>
      ) : <Empty description="请先选择物流方案" />}
    </Drawer>
  )
}
