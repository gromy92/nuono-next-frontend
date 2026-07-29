import { Space, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo } from 'react'
import type { OperationConfigVersionRow } from '../types'
import { actionButton, configTypeTag, statusTag } from '../versionLibraryPresentation'
import type { OperationConfigVersionConfigType } from '../versionLibraryTypes'
import type { useOperationConfigLibraryController } from './useOperationConfigLibraryController'
import type { useOperationConfigPublishActions } from './useOperationConfigPublishActions'

const { Text } = Typography

export function useOperationConfigVersionColumns({ state, publish, configType }: {
  state: ReturnType<typeof useOperationConfigLibraryController>
  publish: ReturnType<typeof useOperationConfigPublishActions>
  configType?: OperationConfigVersionConfigType
}) {
  const { copyingVersionNo, deletingVersionNo, publishingVersionNo, disablingVersionNo,
    openEditor, openDetail, copyVersion, deleteVersion, setPublishCandidate } = state
  const { disableVersion } = publish
  const columns = useMemo<ColumnsType<OperationConfigVersionRow>>(() => {
    const nextColumns: ColumnsType<OperationConfigVersionRow> = [
      {
        title: '版本',
        dataIndex: 'displayName',
        key: 'displayName',
        width: 250,
        render: (_: unknown, record) => (
          <Space direction="vertical" size={2}>
            <Text strong>{record.displayName}</Text>
          </Space>
        )
      }
    ]
    if (!configType) {
      nextColumns.push({
        title: '配置类型',
        dataIndex: 'configTypeLabel',
        key: 'configTypeLabel',
        width: 140,
        render: (_: unknown, record) => configTypeTag(record)
      })
    }
    nextColumns.push(
      {
        title: '状态',
        dataIndex: 'statusLabel',
        key: 'statusLabel',
        width: 130,
        render: (_: unknown, record) => statusTag(record)
      },
      {
        title: '摘要',
        dataIndex: 'summary',
        key: 'summary',
        width: 220,
        render: (value: string | null | undefined, record) => value || `${record.itemCount} 项`
      },
      {
        title: '范围',
        dataIndex: 'scopeSummary',
        key: 'scopeSummary',
        width: 160,
        render: (value?: string | null) => value || '未设置'
      },
      {
        title: '操作',
        key: 'actions',
        width: 520,
        render: (_: unknown, record) => (
          <Space size={4}>
            {actionButton(record, 'EDIT', '编辑', openEditor)}
            {actionButton(record, 'DETAIL', '查看详情', openDetail)}
            {actionButton(record, 'COPY', copyingVersionNo === record.versionNo ? '复制中' : '复制版本', copyVersion)}
            {actionButton(record, 'DELETE', deletingVersionNo === record.versionNo ? '删除中' : '删除', deleteVersion)}
            {actionButton(record, 'PUBLISH', publishingVersionNo === record.versionNo ? '发布中' : '发布', setPublishCandidate)}
            {actionButton(record, 'DISABLE', disablingVersionNo === record.versionNo ? '停用中' : '停用', disableVersion)}
          </Space>
        )
      }
    )
    return nextColumns
  }, [configType, copyingVersionNo, deletingVersionNo, publishingVersionNo, disablingVersionNo])
  return columns
}
