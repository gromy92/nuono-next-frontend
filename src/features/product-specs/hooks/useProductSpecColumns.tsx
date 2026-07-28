import { Space, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo } from 'react'
import { formatProductValue as formatSnapshotValue } from '../../product-domain/productValueFormatting'
import { DomesticSpecMatrix } from '../components/DomesticSpecMatrix'
import { LogisticsInlineEditor } from '../components/LogisticsInlineEditor'
import { ProductThumb } from '../components/ProductThumb'
import { productSpecRowKey } from '../specDomain'
import type { ProductVariantSpecPayload } from '../types'
import type { useProductSpecsController } from './useProductSpecsController'

const { Paragraph, Text } = Typography

export function useProductSpecColumns(
  state: ReturnType<typeof useProductSpecsController>
) {
  const {
    editingDraft, editingKey, handleCancelEdit, handleChangeLogisticsProfile,
    handleDraftNumberChange, handleSaveSource, handleSelectEffectiveSource,
    handleStartEdit, logisticsSavingKey, savingKey, selectingEffectiveKey,
    storeCode, storeLabelByCode
  } = state
  return useMemo<ColumnsType<ProductVariantSpecPayload>>(() => [
    {
      title: '商品',
      width: 284,
      render: (_, row) => (
        <Space size={8} align="start" style={{ minWidth: 0, width: 276 }}>
          <ProductThumb
            src={row.imageUrl}
            alt={formatSnapshotValue(row.title || row.partnerSku)}
            variantId={row.variantId}
          />
          <Space direction="vertical" size={2} style={{ minWidth: 0, maxWidth: 198 }}>
            <Tooltip title={formatSnapshotValue(row.title)}>
              <Paragraph
                strong
                data-testid={row.variantId ? `product-spec-title-${row.variantId}` : undefined}
                ellipsis={{ rows: 3 }}
                style={{ maxWidth: 198, fontSize: 12, lineHeight: '16px', marginBottom: 0 }}
              >
                {formatSnapshotValue(row.title)}
              </Paragraph>
            </Tooltip>
            <Text type="secondary" style={{ fontSize: 12 }}>
              PSKU {formatSnapshotValue(row.partnerSku)}
            </Text>
            <Text type="secondary" ellipsis style={{ fontSize: 13, maxWidth: 198 }}>
              {formatSnapshotValue(
                storeLabelByCode.get(row.storeCode || storeCode) || row.storeCode || storeCode
              )}
            </Text>
          </Space>
        </Space>
      )
    },
    {
      title: '国内规格',
      width: 550,
      render: (_, row) => (
        <DomesticSpecMatrix
          row={row}
          sources={row.sources || []}
          effectiveSourceId={row.effectiveSourceId}
          effectiveSourceType={row.effectiveSourceType}
          editingKey={editingKey}
          editingDraft={editingDraft}
          savingKey={savingKey}
          selectingEffectiveKey={selectingEffectiveKey}
          onStartEdit={handleStartEdit}
          onDraftNumberChange={handleDraftNumberChange}
          onCancelEdit={handleCancelEdit}
          onSaveSource={handleSaveSource}
          onSelectEffectiveSource={handleSelectEffectiveSource}
        />
      )
    },
    {
      title: '物流属性',
      width: 250,
      fixed: 'right',
      render: (_, row) => (
        <LogisticsInlineEditor
          row={row}
          saving={logisticsSavingKey === productSpecRowKey(row)}
          savingBlocked={Boolean(logisticsSavingKey)}
          onChange={handleChangeLogisticsProfile}
        />
      )
    }
  ], [
    editingDraft, editingKey, handleCancelEdit, handleChangeLogisticsProfile,
    handleDraftNumberChange, handleSaveSource, handleSelectEffectiveSource,
    handleStartEdit, logisticsSavingKey, savingKey, selectingEffectiveKey,
    storeCode, storeLabelByCode
  ])
}
