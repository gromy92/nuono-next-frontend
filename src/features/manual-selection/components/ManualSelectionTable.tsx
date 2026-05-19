import { Table } from 'antd'
import type { ManualSelectionTableProps } from '../types'
import { buildManualSelectionTableColumns } from './ManualSelectionTable.columns'

export function ManualSelectionTable(props: ManualSelectionTableProps) {
  const { dataSource, loading, recollecting, onOpenDetail, onRecollect } = props

  const columns = buildManualSelectionTableColumns({
    recollecting,
    onOpenDetail,
    onRecollect
  })

  return (
    <Table
      data-testid="manual-selection-table"
      rowKey="id"
      size="middle"
      loading={loading}
      columns={columns}
      dataSource={dataSource}
      scroll={{ x: 1510 }}
      locale={{ emptyText: '暂无人工选品采集记录' }}
      pagination={{
        pageSize: 50,
        showSizeChanger: false,
        showTotal: (total) => `共 ${total} 条`
      }}
    />
  )
}
