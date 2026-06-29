import { Button, Divider, Drawer, Space, Table, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { InTransitBatchEditorController } from './useInTransitBatchEditor'
import { stripedRowClassName } from './InTransitGoodsPage.utils'
import { useInTransitEditorColumns } from './useInTransitEditorColumns'
import { InTransitBatchBaseForm } from './InTransitBatchBaseForm'
import { InTransitLineEditorForm } from './InTransitLineEditorForm'
import { InTransitNodeTimeline } from './InTransitNodeTimeline'

const { Title } = Typography

type InTransitBatchEditorDrawerProps = {
  editor: InTransitBatchEditorController
  forwarderOptions: Array<{ label: string; value: number }>
  transportOptions: Array<{ label: string; value: string }>
  statusOptions: Array<{ label: string; value: string }>
  destinationOptions: Array<{ label: string; value: string }>
  nodeOptions: Array<{ label: string; value: string }>
  nodeStatusLabel: Map<string, string>
}

export function InTransitBatchEditorDrawer({
  editor,
  forwarderOptions,
  transportOptions,
  statusOptions,
  destinationOptions,
  nodeOptions,
  nodeStatusLabel
}: InTransitBatchEditorDrawerProps) {
  const { lineColumns, freightBillColumns, freightComponentColumns } = useInTransitEditorColumns({
    submittingLine: editor.submittingLine,
    onOpenEditLine: editor.openEditLine,
    onRemoveLine: (row) => void editor.removeLine(row)
  })

  return (
    <Drawer
      title={editor.editingBatch ? '编辑在途批次' : '新建在途批次'}
      open={editor.drawerOpen}
      width={960}
      destroyOnClose
      onClose={() => editor.setDrawerOpen(false)}
      extra={
        <Space>
          <Button onClick={() => editor.setDrawerOpen(false)}>取消</Button>
          {editor.batchOperationLocked ? null : (
            <Button type="primary" loading={editor.submitting} onClick={() => void editor.submit()}>
              保存
            </Button>
          )}
        </Space>
      }
    >
      <InTransitBatchBaseForm
        editor={editor}
        forwarderOptions={forwarderOptions}
        transportOptions={transportOptions}
        statusOptions={statusOptions}
        destinationOptions={destinationOptions}
      />
      {editor.editingBatch ? (
        <>
          <Divider />
          <div className="in-transit-lines">
            <div className="in-transit-lines__header">
              <Title level={5} style={{ margin: 0 }}>商品明细</Title>
              <Button icon={<PlusOutlined />} onClick={editor.openCreateLine}>添加商品</Button>
            </div>
            <Table
              rowKey="lineId"
              rowClassName={stripedRowClassName}
              columns={lineColumns}
              dataSource={editor.lines}
              loading={editor.loadingLines}
              pagination={false}
              scroll={{ x: 1050 }}
              size="small"
            />
            <InTransitLineEditorForm editor={editor} />
          </div>

          <Divider />
          <div className="in-transit-freight">
            <div className="in-transit-lines__header">
              <Title level={5} style={{ margin: 0 }}>实际运费</Title>
            </div>
            <Table
              rowKey="id"
              rowClassName={stripedRowClassName}
              columns={freightBillColumns}
              dataSource={editor.batchFreightCosts.bills}
              loading={editor.loadingBatchFreightCosts}
              pagination={false}
              size="small"
              scroll={{ x: 820 }}
              locale={{ emptyText: '暂无实际运费账单' }}
            />
            <Table
              rowKey="id"
              rowClassName={stripedRowClassName}
              columns={freightComponentColumns}
              dataSource={editor.batchFreightCosts.components}
              loading={editor.loadingBatchFreightCosts}
              pagination={false}
              size="small"
              scroll={{ x: 680 }}
              locale={{ emptyText: '暂无实际运费明细' }}
              style={{ marginTop: 12 }}
            />
          </div>

          <Divider />
          <InTransitNodeTimeline editor={editor} nodeOptions={nodeOptions} nodeStatusLabel={nodeStatusLabel} />
        </>
      ) : null}
    </Drawer>
  )
}
