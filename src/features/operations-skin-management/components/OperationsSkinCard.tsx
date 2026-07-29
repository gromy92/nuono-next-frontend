import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Space, Tag, Tooltip, Typography } from 'antd'
import { isSystemPreviewSkin, type OperationsSkinGalleryRow } from '../skinGalleryRows'
import {
  formatTime, skinAssetCount, skinHeroComponentCount, skinHeroComponentRequiredCount,
  skinNote, skinScenario, skinSuiteComponentCount, skinSuiteComponentRequiredCount, statusTag
} from '../skinPageModel'
import type { OperationsSkinView } from '../types'
import { OperationsSkinPreview } from './OperationsSkinPreview'

const { Paragraph, Text } = Typography

export type OperationsSkinCardProps = {
  row: OperationsSkinGalleryRow
  statusUpdating: boolean
  deleting: boolean
  onEdit: (row: OperationsSkinGalleryRow) => void
  onToggleStatus: (row: OperationsSkinView) => void
  onDelete: (row: OperationsSkinView) => void
}

export function OperationsSkinCard({ row, statusUpdating, deleting, onEdit, onToggleStatus, onDelete }: OperationsSkinCardProps) {
  const previewOnly = isSystemPreviewSkin(row)
  const disabledReason = previewOnly ? '系统预设皮肤接入后端后可编辑' : undefined
  const scenario = skinScenario(row)
  const note = skinNote(row)

  return (
    <article className="operations-skin-card">
      <OperationsSkinPreview row={row} />
      <div className="operations-skin-card-body">
        <div className="operations-skin-card-title-row">
          <Text strong className="operations-skin-card-title">
            {row.skinName}
          </Text>
          {statusTag(row.status)}
        </div>

        <Paragraph className="operations-skin-card-description" ellipsis={{ rows: 2 }}>
          {row.styleDescription || note || '主图 + 副图套系'}
        </Paragraph>

        <div className="operations-skin-card-meta">
          <Space size={4} wrap>
            <Tag>{scenario}</Tag>
            <Tag color={skinHeroComponentCount(row) >= skinHeroComponentRequiredCount(row) ? 'success' : 'warning'}>
              主图组件 {skinHeroComponentCount(row)}/{skinHeroComponentRequiredCount(row)}
            </Tag>
            <Tag color={skinSuiteComponentCount(row) >= skinSuiteComponentRequiredCount() ? 'success' : 'warning'}>
              套图组件 {skinSuiteComponentCount(row)}/{skinSuiteComponentRequiredCount()}
            </Tag>
          </Space>
          <Text type="secondary">参考 {skinAssetCount(row)}</Text>
        </div>

        <div className="operations-skin-card-footer">
          <Text type="secondary">{previewOnly ? '系统预设' : formatTime(row.updatedAt)}</Text>
          <Space size={4}>
            <Tooltip title={previewOnly ? '查看详情页套系' : undefined}>
              <Button size="small" type="text" icon={<EditOutlined />} onClick={() => onEdit(row)}>
                编辑
              </Button>
            </Tooltip>
            <Tooltip title={disabledReason}>
              <span>
                <Button
                  size="small"
                  type="text"
                  disabled={previewOnly}
                  loading={statusUpdating}
                  onClick={() => onToggleStatus(row)}
                >
                  {row.status === 'ACTIVE' ? '停用' : '启用'}
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={disabledReason}>
              <span>
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={previewOnly}
                  loading={deleting}
                  onClick={() => onDelete(row)}
                >
                  删除
                </Button>
              </span>
            </Tooltip>
          </Space>
        </div>
      </div>
    </article>
  )
}
