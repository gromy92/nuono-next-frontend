import { EditOutlined } from '@ant-design/icons'
import { Alert, Button, Empty, Modal, Segmented, Select, Space, Table, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { WarehouseSiteCode } from './types'
import type { useReadyWorkspace } from './useReadyWorkspace'
import { resolveReadyProductSpecsScope } from './readyDomain'
import {
  renderReadyFulfillmentCell,
  renderReadyProductCell,
  renderReadyQuoteCell,
  renderReadySiteCell,
  renderReadySourceCell
} from './WarehouseReadyCells'
import { renderSpecStatus } from './WarehouseDispatchSharedView'
import type { ProductBaselineSummary, ReadyShipmentRow, ReceiptOrderMeta } from './workbenchModels'
import {
  DISPATCH_TARGET_SITE_OPTIONS,
  DISPATCH_TARGET_TRANSPORT_OPTIONS,
  READY_FILTER_OPTIONS,
  READY_ITEM_TABLE_PAGINATION,
  SITE_LABELS,
  TRANSPORT_LABELS
} from './workbenchModels'

const { Text } = Typography

type WarehouseReadyPanelProps = {
  workspace: ReturnType<typeof useReadyWorkspace>
  productBaselineByScope: Record<string, ProductBaselineSummary>
  productBaselineError?: string
  orderMetaById: Map<string, ReceiptOrderMeta>
  dataLoading: boolean
  canOpenProductSpecs: boolean
  onOpenProductSpecs: (item: ReadyShipmentRow) => void
}

export function WarehouseReadyPanel({
  workspace,
  productBaselineByScope,
  productBaselineError,
  orderMetaById,
  dataLoading,
  canOpenProductSpecs,
  onOpenProductSpecs
}: WarehouseReadyPanelProps) {
  const columns: ColumnsType<ReadyShipmentRow> = [
    { title: '商品', dataIndex: 'psku', render: (_, item) => renderReadyProductCell(
      item,
      productBaselineByScope
    ) },
    {
      title: '货主',
      width: 104,
      render: (_, item) => item.ownerUserId
        ? <Tag color="blue">账号 {item.ownerUserId}</Tag>
        : <Tag color="red">归属缺失</Tag>
    },
    { title: '来源', render: (_, item) => renderReadySourceCell(
      item,
      orderMetaById,
      workspace.openTargetModal
    ) },
    { title: '报价', width: 116, render: (_, item) => renderReadyQuoteCell(item) },
    { title: '履约', width: 96, render: (_, item) => renderReadyFulfillmentCell(item) },
    { title: '站点', render: (_, item) => renderReadySiteCell(item) },
    {
      title: '规格',
      width: 112,
      render: (_, item) => {
        const specsScope = resolveReadyProductSpecsScope(item)
        return (
          <Space direction="vertical" size={4}>
            {renderSpecStatus(item.specStatus)}
            <Tooltip title={!canOpenProductSpecs
              ? '当前账号无商品/采购规格权限；仓管规格请在仓管 APP 收货时维护'
              : specsScope ? undefined : '库存归属缺失或涉及多个店铺，暂不能编辑规格'}>
              <span>
                <Button aria-label={`编辑 ${item.psku} 规格`} icon={<EditOutlined />} size="small"
                  disabled={!canOpenProductSpecs || !specsScope}
                  type={item.specStatus === 'missing' ? 'primary' : 'default'}
                  onClick={() => onOpenProductSpecs(item)}>
                  编辑规格
                </Button>
              </span>
            </Tooltip>
          </Space>
        )
      }
    },
    { title: '可发', dataIndex: 'availableQty' }
  ]
  return (
    <>
      <div className="warehouse-dispatch-panel">
        {productBaselineError ? (
          <Alert showIcon type="warning" message={productBaselineError}
            className="warehouse-dispatch-data-alert" />
        ) : null}
        <div className="warehouse-dispatch-toolbar">
          <div className="warehouse-dispatch-toolbar-left">
            <Segmented size="small" value={workspace.filter} options={READY_FILTER_OPTIONS}
              onChange={workspace.setFilter} />
          </div>
        </div>
        <Table rowKey="id" size="small" columns={columns} dataSource={workspace.visibleItems}
          loading={dataLoading} pagination={READY_ITEM_TABLE_PAGINATION}
          locale={{ emptyText: <Empty description="暂无库存" /> }} />
      </div>
      <DispatchTargetModal workspace={workspace} />
    </>
  )
}

function DispatchTargetModal({ workspace }: { workspace: ReturnType<typeof useReadyWorkspace> }) {
  const modal = workspace.targetModal
  return (
    <Modal title="调整发货目标" open={Boolean(modal)} confirmLoading={workspace.targetSubmitting}
      okText="保存计划" cancelText="取消" onCancel={workspace.closeTargetModal}
      onOk={() => { void workspace.confirmTargetOverride() }} okButtonProps={{ disabled: !modal }}>
      {modal ? (
        <Space direction="vertical" size={12} className="warehouse-dispatch-target-modal">
          <div className="warehouse-dispatch-target-summary">
            <SummaryValue className="warehouse-dispatch-target-summary-psku" label="PSKU" value={modal.source.psku} />
            <SummaryValue label="来源" value={modal.source.orderTitle || modal.source.orderNo || '-'} />
            <SummaryValue label="原计划" value={`${SITE_LABELS[
              modal.source.originalSiteCode || modal.source.siteCode
            ]} / ${TRANSPORT_LABELS[
              modal.source.originalTransportMode || modal.source.transportMode
            ]}`} />
            <SummaryValue label="当前可发" value={modal.source.availableQty} />
          </div>
          <div className="warehouse-dispatch-target-section">
            <Text strong className="warehouse-dispatch-target-section-title">发货目标</Text>
            <div className="warehouse-dispatch-target-fields">
              <label className="warehouse-dispatch-target-field">
                <span className="warehouse-dispatch-field-label">目标站点</span>
                <Select<WarehouseSiteCode> value={modal.targetSiteCode} options={DISPATCH_TARGET_SITE_OPTIONS}
                  onChange={(targetSiteCode) => workspace.updateTargetModal({ targetSiteCode })} />
              </label>
              <label className="warehouse-dispatch-target-field">
                <span className="warehouse-dispatch-field-label">运输方式</span>
                <Select value={modal.targetTransportMode} options={DISPATCH_TARGET_TRANSPORT_OPTIONS}
                  onChange={(targetTransportMode) => workspace.updateTargetModal({ targetTransportMode })} />
              </label>
            </div>
          </div>
        </Space>
      ) : null}
    </Modal>
  )
}

function SummaryValue({ label, value, className }: {
  label: string
  value: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <Text type="secondary">{label}</Text>
      <Text strong>{value}</Text>
    </div>
  )
}
