import { Table } from 'antd'
import type { ManualSelectionTableProps } from '../types'
import { buildManualSelectionTableColumns } from './ManualSelectionTable.columns'

export function ManualSelectionTable(props: ManualSelectionTableProps) {
  const { dataSource, loading, pagination, recollecting, onOpenDetail, onPageChange, onRecollect } = props

  const columns = buildManualSelectionTableColumns({
    recollecting,
    onOpenDetail,
    onRecollect
  })

  return (
    <Table
      data-testid="manual-selection-table"
      rowKey="id"
      size="small"
      loading={loading}
      columns={columns}
      dataSource={dataSource}
      tableLayout="fixed"
      scroll={{ x: 1360 }}
      locale={{ emptyText: '暂无人工选品采集记录' }}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: false,
        showTotal: (total) => `共 ${total} 条`
      }}
      onChange={(nextPagination) => {
        onPageChange(nextPagination.current || 1, nextPagination.pageSize || pagination.pageSize)
      }}
    />
  )
}
