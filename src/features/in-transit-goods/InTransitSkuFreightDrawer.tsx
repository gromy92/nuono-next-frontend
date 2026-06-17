import { Button, Divider, Drawer, Space, Table, Tag, Typography } from 'antd'
import type { InTransitForwarderFreightComparisonRow, InTransitSkuFreightCostHistoryRow } from './types'
import { stripedRowClassName } from './InTransitGoodsPage.utils'
import { useInTransitSkuFreightColumns } from './useInTransitSkuFreightColumns'

const { Title } = Typography

type InTransitSkuFreightDrawerProps = {
  open: boolean
  context: { psku: string; targetSiteCode: string } | null
  history: InTransitSkuFreightCostHistoryRow[]
  comparison: InTransitForwarderFreightComparisonRow[]
  loading: boolean
  onClose: () => void
}

export function InTransitSkuFreightDrawer({
  open,
  context,
  history,
  comparison,
  loading,
  onClose
}: InTransitSkuFreightDrawerProps) {
  const { skuFreightHistoryColumns, forwarderComparisonColumns } = useInTransitSkuFreightColumns()
  return (
    <Drawer title="SKU运费历史" open={open} width={880} destroyOnClose onClose={onClose} extra={<Button onClick={onClose}>关闭</Button>}>
      <Space size={8} wrap>
        <Tag color="blue">PSKU {context?.psku || '-'}</Tag>
        <Tag color="purple">站点 {context?.targetSiteCode || '-'}</Tag>
      </Space>
      <Divider />
      <Title level={5} style={{ marginTop: 0 }}>历史成本</Title>
      <Table
        rowKey={(row, index) => `${row.psku || 'sku'}-${row.businessOccurredAt || index}-${row.standardFeeType || ''}`}
        rowClassName={stripedRowClassName}
        columns={skuFreightHistoryColumns}
        dataSource={history}
        loading={loading}
        pagination={false}
        size="small"
        scroll={{ x: 760 }}
        locale={{ emptyText: '暂无 SKU 运费历史' }}
      />
      <Divider />
      <Title level={5} style={{ marginTop: 0 }}>货代对比</Title>
      <Table
        rowKey={(row, index) => `${row.standardForwarderId ?? index}-${row.standardFeeType || ''}-${row.chargeUnit || ''}`}
        rowClassName={stripedRowClassName}
        columns={forwarderComparisonColumns}
        dataSource={comparison}
        loading={loading}
        pagination={false}
        size="small"
        scroll={{ x: 640 }}
        locale={{ emptyText: '暂无货代对比' }}
      />
    </Drawer>
  )
}
