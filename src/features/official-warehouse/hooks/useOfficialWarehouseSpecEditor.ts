import { message } from 'antd'
import { useState } from 'react'
import { saveProductSpecSource } from '../../product-specs/api'
import type { OfficialWarehouseProductCandidate } from '../api'
import {
  displayPsku,
  officialWarehouseCandidateKey
} from '../officialWarehouseCandidatePresentation'
import type { Ali1688SpecDraft } from '../officialWarehouseFormModel'

export function useOfficialWarehouseSpecEditor({
  storeCode,
  selectedShippingBatchIds,
  candidateKeyword,
  reloadCandidates
}: {
  storeCode: string
  selectedShippingBatchIds: string[]
  candidateKeyword: string
  reloadCandidates: (batchIds?: string[], keywordValue?: string) => Promise<void>
}) {
  const [specTarget, setSpecTarget] = useState<OfficialWarehouseProductCandidate>()
  const [specDraft, setSpecDraft] = useState<Ali1688SpecDraft>({})
  const [specSaving, setSpecSaving] = useState(false)

  function openSpecEditor(row: OfficialWarehouseProductCandidate) {
    setSpecTarget(row)
    setSpecDraft({
      productLengthCm: row.productLengthCm,
      productWidthCm: row.productWidthCm,
      productHeightCm: row.productHeightCm,
      productWeightG: row.productWeightG,
      cartonLengthCm: row.cartonLengthCm,
      cartonWidthCm: row.cartonWidthCm,
      cartonHeightCm: row.cartonHeightCm,
      cartonWeightKg: row.cartonWeightKg,
      cartonQuantity: row.cartonQuantity
    })
  }

  async function saveAli1688Spec() {
    if (!specTarget) return
    if (!specDraft.productLengthCm || !specDraft.productWidthCm || !specDraft.productHeightCm) {
      message.warning('请填写产品长、宽、高')
      return
    }
    setSpecSaving(true)
    try {
      const hasCarton = Boolean(
        specDraft.cartonLengthCm || specDraft.cartonWidthCm || specDraft.cartonHeightCm ||
        specDraft.cartonWeightKg || specDraft.cartonQuantity
      )
      await saveProductSpecSource({
        storeCode,
        variantId: Number(specTarget.productVariantId),
        partnerSku: specTarget.partnerSku,
        currentZCode: specTarget.skuParent,
        sourceType: 'ali1688',
        cartonSourceType: hasCarton ? 'factory_carton' : 'none',
        ...specDraft
      })
      message.success(`${displayPsku(specTarget)} 的 1688 规格已保存`)
      setSpecTarget(undefined)
      await reloadCandidates(selectedShippingBatchIds, candidateKeyword)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存 1688 规格失败')
    } finally {
      setSpecSaving(false)
    }
  }


  return {
    specTarget,
    setSpecTarget,
    specDraft,
    setSpecDraft,
    specSaving,
    openSpecEditor,
    saveAli1688Spec
  }
}
