import { Table } from 'antd'
import { useMemo, type Key } from 'react'
import type { ManualSelectionTableProps } from '../types'
import { buildManualSelectionTableColumns } from './ManualSelectionTable.columns'

export function ManualSelectionTable(props: ManualSelectionTableProps) {
  const {
    analysisCollectionIds,
    analysisProjectByCollectionId,
    dataSource,
    deletingCollectionIds,
    loading,
    recollecting,
    selectedRowKeys,
    onAddToAnalysis,
    onDelete,
    onOpenDetail,
    onRecollect,
    onSelectedRowKeysChange
  } = props
  const analysisIdSet = useMemo(() => new Set(analysisCollectionIds), [analysisCollectionIds])

  const columns = buildManualSelectionTableColumns({
    analysisCollectionIds,
    analysisProjectByCollectionId,
    deletingCollectionIds,
    recollecting,
    onAddToAnalysis,
    onDelete,
    onOpenDetail,
    onRecollect
  })

  return (
    <Table
      data-testid="manual-selection-table"
      rowKey="id"
      size="middle"
      className="manual-selection-collection-table"
      tableLayout="fixed"
      loading={loading}
      columns={columns}
      dataSource={dataSource}
      rowSelection={{
        selectedRowKeys,
        onChange: (keys: Key[]) => onSelectedRowKeysChange(keys.map(String)),
        getCheckboxProps: (record) => ({
          disabled: record.status !== 'success' || analysisIdSet.has(record.id),
          title: analysisIdSet.has(record.id)
            ? `已入组：${analysisProjectByCollectionId[record.id]?.projectName || '未命名组'}`
            : record.status === 'success'
              ? '加入组'
              : '采集成功后才能加入组'
        })
      }}
      scroll={{ x: 1248 }}
      locale={{ emptyText: '暂无人工选品采集记录' }}
      pagination={{
        pageSize: 50,
        showSizeChanger: false,
        showTotal: (total) => `共 ${total} 条`
      }}
    />
  )
}
