import { ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Empty, Input, Select, Space, Table, Typography } from 'antd'
import { useProfitColumns } from '../hooks/useProfitColumns'
import { useProfitDetailState } from '../hooks/useProfitDetailState'
import type { ProfitCalculatorPageProps } from '../profitPageTypes'
import { profitRowKey } from '../profitWorkspaceModel'
import { CommissionDetailModal, OutboundFeeDetailModal } from './ProfitDetailModals'

const { Text } = Typography

export function ProfitCalculatorWorkbench(props: ProfitCalculatorPageProps) {
  const detail = useProfitDetailState(props)
  const columns = useProfitColumns({
    props,
    openOutboundFeeDetail: detail.openOutboundFeeDetail,
    openCommissionDetail: detail.openCommissionDetail
  })
  const calculatedCount = Object.values(props.outboundFeeByRowKey)
    .filter((item) => item.status === 'CALCULATED').length
  const failedCount = Object.values(props.outboundFeeByRowKey)
    .filter((item) => item.status === 'FAILED').length
  const commissionCalculatedCount = Object.values(props.commissionByRowKey)
    .filter((item) => item.status === 'CALCULATED').length
  const commissionFailedCount = Object.values(props.commissionByRowKey)
    .filter((item) => item.status === 'FAILED').length

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card variant="borderless" style={{ border: '1px solid #dbe4ea' }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space wrap>
            <Input
              allowClear
              placeholder="搜索 SKU / PSKU / barcode"
              style={{ width: 240 }}
              value={props.filters.skuQuery}
              onChange={(event) => props.onFiltersChange({
                ...props.filters, skuQuery: event.target.value
              })}
            />
            <Input
              allowClear
              placeholder="搜索标题"
              style={{ width: 220 }}
              value={props.filters.titleQuery}
              onChange={(event) => props.onFiltersChange({
                ...props.filters, titleQuery: event.target.value
              })}
            />
            <Select
              style={{ width: 160 }}
              value={props.filters.outboundFeeFilter}
              options={[
                { label: '已计算', value: 'calculated' },
                { label: '计算失败', value: 'failed' },
                { label: '待计算', value: 'pending' }
              ]}
              onChange={(value) => props.onFiltersChange({
                ...props.filters, outboundFeeFilter: value
              })}
            />
            <Select
              style={{ width: 150 }}
              value={props.filters.differenceFilter}
              options={[
                { label: '全部差异', value: 'all' },
                { label: '任一有差异', value: 'any' },
                { label: '出舱费有差异', value: 'outboundFee' },
                { label: '佣金有差异', value: 'commission' }
              ]}
              onChange={(value) => props.onFiltersChange({
                ...props.filters, differenceFilter: value
              })}
            />
            <Button
              icon={<ReloadOutlined />}
              loading={props.listState.status === 'loading'}
              onClick={() => void props.onRefresh()}
            >
              刷新列表
            </Button>
            <Button
              type="primary"
              loading={props.bulkCalculating}
              onClick={() => void props.onCalculateSelectedOutboundFees()}
            >
              批量计算出舱费{props.selectedRowKeys.length ? `(${props.selectedRowKeys.length})` : ''}
            </Button>
            <Button
              loading={props.bulkCommissionCalculating}
              onClick={() => void props.onCalculateSelectedCommissions()}
            >
              批量计算佣金{props.selectedRowKeys.length ? `(${props.selectedRowKeys.length})` : ''}
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              出舱费已计算 {calculatedCount}，失败 {failedCount}；佣金已计算 {commissionCalculatedCount}，
              失败 {commissionFailedCount}；当前 {props.filteredRows.length} 行
            </Text>
          </Space>
        </Space>
      </Card>

      {props.listState.status === 'error' ? (
        <Alert type="error" showIcon message="利润商品列表加载失败" description={props.listState.message} />
      ) : null}
      <Card variant="borderless" style={{ border: '1px solid #dbe4ea' }}>
        {props.listState.status === 'idle' ? (
          <Empty description="当前账号没有可用店铺上下文" />
        ) : (
          <Table
            rowKey={profitRowKey}
            loading={props.listState.status === 'loading'}
            columns={columns}
            dataSource={props.filteredRows}
            rowSelection={{
              selectedRowKeys: props.selectedRowKeys,
              onChange: props.onSelectedRowKeysChange
            }}
            pagination={{ pageSize: 50, showSizeChanger: true }}
            scroll={{ x: 1870 }}
            size="small"
          />
        )}
      </Card>

      <OutboundFeeDetailModal
        detail={detail.detailState}
        currentCalculation={detail.detailState
          ? props.outboundFeeByRowKey[detail.detailState.rowKey]
          : undefined}
        actualSnapshot={detail.detailState
          ? props.actualOutboundFeeByRowKey[detail.detailState.rowKey]
          : undefined}
        calculating={detail.detailState
          ? props.calculatingRowKey === detail.detailState.rowKey
          : false}
        onCalculate={props.onCalculateOutboundFee}
        onClose={detail.closeOutboundFeeDetail}
      />
      <CommissionDetailModal
        detail={detail.commissionDetailState}
        currentCalculation={detail.commissionDetailState
          ? props.commissionByRowKey[detail.commissionDetailState.rowKey]
          : undefined}
        actualSnapshot={detail.commissionDetailState
          ? props.actualCommissionByRowKey[detail.commissionDetailState.rowKey]
          : undefined}
        calculating={detail.commissionDetailState
          ? props.calculatingCommissionRowKey === detail.commissionDetailState.rowKey
          : false}
        onCalculate={props.onCalculateCommission}
        onClose={detail.closeCommissionDetail}
      />
    </Space>
  )
}
