import { message } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ProductCompetitorContentMaterial } from '../product-domain/productCompetitorContent'
import { generateProductListingAiListing } from './api'
import { aiListingDraftPatch, hasListingAiInput } from './productListingAiDraft'
import {
  productListingEditorDraftToPayload,
  type ProductListingEditorDraft
} from './productDetailAdapter'
import type { ProductListingAiListingData } from './types'

type Params = {
  draft: ProductListingEditorDraft
  competitorMaterials: ProductCompetitorContentMaterial[]
  onPatchDraft: (patch: Partial<ProductListingEditorDraft>) => void
}

export function useProductListingAiGeneration({
  draft,
  competitorMaterials,
  onPatchDraft
}: Params) {
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<ProductListingAiListingData>()
  const [resultApplied, setResultApplied] = useState(false)
  const [resultReady, setResultReady] = useState(false)
  const [resultInputFingerprint, setResultInputFingerprint] = useState<string>()
  const requestSeq = useRef(0)
  const inputReady = useMemo(
    () => hasListingAiInput(draft, competitorMaterials),
    [draft, competitorMaterials]
  )
  const inputFingerprint = useMemo(
    () =>
      JSON.stringify({
        draft: productListingEditorDraftToPayload(draft),
        competitorMaterials
      }),
    [draft, competitorMaterials]
  )
  const inputFingerprintRef = useRef(inputFingerprint)
  inputFingerprintRef.current = inputFingerprint

  useEffect(() => {
    if (
      resultInputFingerprint &&
      resultInputFingerprint !== inputFingerprint
    ) {
      setResult(undefined)
      setResultReady(false)
      setResultApplied(false)
      setResultInputFingerprint(undefined)
    }
  }, [inputFingerprint, resultInputFingerprint])

  const generate = async () => {
    if (!inputReady) {
      message.warning('请先填写商品标题、描述、卖点、已验证属性或带入竞品材料')
      return
    }
    const currentRequestSeq = ++requestSeq.current
    const requestInputFingerprint = inputFingerprint
    setGenerating(true)
    setResultApplied(false)
    setResultReady(false)
    try {
      const response = await generateProductListingAiListing({
        draft: productListingEditorDraftToPayload(draft),
        competitorMaterials
      })
      if (
        requestSeq.current !== currentRequestSeq ||
        inputFingerprintRef.current !== requestInputFingerprint
      ) {
        message.warning('商品资料已变化，本次 AI 结果已丢弃，请重新生成')
        return
      }
      if (!response.data) {
        setResult(undefined)
        setResultReady(false)
        message.warning(response.message || response.msg || 'AI 未返回可用 Listing 结果')
        return
      }
      if (response.ready !== true) {
        setResult(undefined)
        setResultReady(false)
        message.warning(response.message || response.msg || 'AI 未能根据现有商品资料生成可用 Listing，请重新生成')
        return
      }
      setResult(response.data)
      setResultInputFingerprint(requestInputFingerprint)
      setResultReady(true)
      message.success('AI Listing 已通过 v3.3 质检')
    } catch (error) {
      setResult(undefined)
      setResultReady(false)
      message.error(errorMessage(error, '商品上架 AI 整合失败'))
    } finally {
      if (requestSeq.current === currentRequestSeq) {
        setGenerating(false)
      }
    }
  }

  const apply = () => {
    if (
      !resultReady ||
      !resultInputFingerprint ||
      resultInputFingerprint !== inputFingerprintRef.current
    ) {
      message.warning('当前 AI Listing 仍有待处理项，不能填入草稿')
      return
    }
    const patch = aiListingDraftPatch(
      result?.noonUploadDraft,
      result?.keywords
    )
    if (!Object.keys(patch).length) {
      message.warning('AI 结果没有可填入草稿的上架字段')
      return
    }
    onPatchDraft(patch)
    setResultApplied(true)
    message.success('AI Listing 已填入当前草稿')
  }

  return {
    apply,
    generate,
    generating,
    inputReady,
    result,
    resultApplied,
    resultReady
  }
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}
