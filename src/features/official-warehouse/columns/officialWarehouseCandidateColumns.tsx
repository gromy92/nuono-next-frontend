import { EditOutlined } from '@ant-design/icons'
import { Button, Image, InputNumber, Space, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { OfficialWarehouseProductCandidate } from '../api'
import type { AsnCandidateSourceMode } from '../hooks/useOfficialWarehouseAsnLineSelection'
import {
  PRODUCT_IMAGE_FALLBACK,
  displayPsku,
  formatDimension,
  officialWarehouseCandidateKey
} from '../officialWarehouseCandidatePresentation'

const { Text } = Typography

export function buildOfficialWarehouseCandidateColumns({
  selectedShippingBatchIds,
  candidateMode,
  quantityByCandidateKey,
  setCandidateQuantity,
  openSpecEditor
}: {
  selectedShippingBatchIds: string[]
  candidateMode: AsnCandidateSourceMode
  quantityByCandidateKey: Record<string, number>
  setCandidateQuantity: (key: string, quantity: number) => void
  openSpecEditor: (row: OfficialWarehouseProductCandidate) => void
}): ColumnsType<OfficialWarehouseProductCandidate> {
  return [
    {
      title: '商品',
      width: 330,
      render: (_, row) => (
        <div className="official-warehouse-product-cell official-warehouse-product-cell--candidate">
          {row.imageUrl ? (
            <Image
              src={row.imageUrl}
              fallback={PRODUCT_IMAGE_FALLBACK}
              width={60}
              height={60}
              preview={{ mask: '查看大图' }}
            />
          ) : (
            <div className="official-warehouse-image-placeholder" />
          )}
          <div className="official-warehouse-stack">
            <Text strong>{row.title || displayPsku(row)}</Text>
          </div>
        </div>
      )
    },
    {
      title: '本次来源',
      width: 150,
      render: () => candidateMode === 'batch'
        ? <Tag color="blue">所选物流单</Tag>
        : <Tag color="gold">手工添加</Tag>
    },
    {
      title: 'Noon SKU',
      width: 260,
      render: (_, row) => {
        const batchLimit = selectedShippingBatchIds.length ? Number(row.batchAvailableQuantity || 0) : 0
        return (
          <div className="official-warehouse-stack">
            <Text copyable>{row.noonSku}</Text>
            <Text type="secondary" copyable>PSKU：{displayPsku(row)}</Text>
            {batchLimit > 0 ? <Text type="secondary">批次可用 {batchLimit}</Text> : null}
          </div>
        )
      }
    },
    {
      title: '尺寸 / 体积',
      width: 180,
      render: (_, row) => (
        <div className="official-warehouse-stack">
          <Text>{formatDimension(row)}</Text>
          <Text type="secondary">{row.cubicFeet ?? '-'} ft³</Text>
        </div>
      )
    },
    {
      title: 'Storage',
      dataIndex: 'storageTypeCode',
      width: 106,
      render: (value?: string) => <Tag>{value || 'standard'}</Tag>
    },
    {
      title: candidateMode === 'batch' ? '物流数量' : '手工数量',
      width: 120,
      render: (_, row) => {
        const batchLimit = selectedShippingBatchIds.length ? Number(row.batchAvailableQuantity || 0) : 0
        const maxQuantity = candidateMode === 'batch' && batchLimit > 0 ? batchLimit : undefined
        const candidateKey = officialWarehouseCandidateKey(row)
        const quantity = quantityByCandidateKey[candidateKey] || maxQuantity || 1
        return (
          <div className="official-warehouse-stack">
            <InputNumber
              min={1}
              max={maxQuantity}
              precision={0}
              value={quantity}
              onChange={(value) => {
                const normalized = Math.max(1, Number(value || 0))
                setCandidateQuantity(candidateKey, maxQuantity ? Math.min(normalized, maxQuantity) : normalized)
              }}
            />
          </div>
        )
      }
    },
    {
      title: '数据状态',
      width: 160,
      render: (_, row) => {
        const canFillSpec = row.missingTags?.includes('缺尺寸')
        return (
          <Space size={4} wrap>
            {row.missingTags?.length ? row.missingTags.map((tag) => <Tag key={tag} color="red">{tag}</Tag>) : <Tag color="green">可创建</Tag>}
            {canFillSpec ? (
              <Button size="small" icon={<EditOutlined />} onClick={() => openSpecEditor(row)}>
                填写规格
              </Button>
            ) : null}
          </Space>
        )
      }
    }
  ]
}
