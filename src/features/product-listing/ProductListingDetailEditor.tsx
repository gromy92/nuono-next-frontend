import { RobotOutlined } from '@ant-design/icons'
import { Button, Input, Space, Tag, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ProductDetailOfficialTabs } from '../product-editor/ProductDetailOfficialTabs'
import { validateProductListingFields } from './api'
import { ProductListingAiResultPreview } from './ProductListingAiResultPreview'
import {
  productListingContentProgress,
  productListingEditorDraftDomains,
  productListingEditorDraftToSiteOffer,
  productListingEditorDraftToPayload,
  productListingEditorDraftToSnapshot,
  productListingEditorDraftToSummary,
  normalizeProductListingEditorDraft,
  type ProductListingEditorDraft
} from './productDetailAdapter'
import type { ProductCompetitorContentMaterial } from '../product-domain/productCompetitorContent'
import type { ProductListingValidationIssue } from './types'
import { useProductListingAiGeneration } from './useProductListingAiGeneration'
import { createProductListingDetailFieldHandlers } from './createProductListingDetailFieldHandlers'
import { listingEditorText } from './productListingDetailValueAdapters'

const { Text } = Typography
const EMPTY_COMPETITOR_MATERIALS: ProductCompetitorContentMaterial[] = []

type ProductListingDetailEditorProps = {
  draft: ProductListingEditorDraft
  competitorMaterials?: ProductCompetitorContentMaterial[]
  ownerUserId?: number
  tabBarExtraContent?: ReactNode
  onDraftChange: (updater: (currentDraft: ProductListingEditorDraft) => ProductListingEditorDraft) => void
}
export function ProductListingDetailEditor({
  competitorMaterials,
  draft,
  ownerUserId,
  tabBarExtraContent,
  onDraftChange
}: ProductListingDetailEditorProps) {
  const listingCompetitorMaterials = competitorMaterials ?? EMPTY_COMPETITOR_MATERIALS
  const [barcodeDraftForValidation, setBarcodeDraftForValidation] = useState('')
  const [fieldValidationIssues, setFieldValidationIssues] = useState<ProductListingValidationIssue[]>([])
  const fieldValidationRequestSeq = useRef(0)
  const snapshot = useMemo(() => productListingEditorDraftToSnapshot(draft, ownerUserId), [draft, ownerUserId])
  const activeSiteOffer = useMemo(() => productListingEditorDraftToSiteOffer(draft), [draft])
  const summary = useMemo(() => productListingEditorDraftToSummary(draft), [draft])
  const domains = useMemo(() => productListingEditorDraftDomains(draft), [draft])
  const contentProgress = useMemo(() => productListingContentProgress(draft), [draft])
  const competitorMaterialsKey = useMemo(
    () => (competitorMaterials || []).map((item) => item.id || item.titleEn || item.titleAr || item.url || '').join('|'),
    [competitorMaterials]
  )
  const imageUrls = useMemo(
    () => (Array.isArray(snapshot.content.images) ? snapshot.content.images.map(String).filter(Boolean) : []),
    [snapshot.content.images]
  )
  const barcodeForValidation = listingEditorText(barcodeDraftForValidation).trim() || listingEditorText(draft.barcode).trim()
  const pskuValidationIssue = useMemo(
    () =>
      fieldValidationIssues.find(
        (issue) => issue.fieldKey === 'psku' && issue.severity === 'error'
      ),
    [fieldValidationIssues]
  )
  const barcodeValidationIssue = useMemo(
    () =>
      fieldValidationIssues.find(
        (issue) => issue.fieldKey === 'barcode' && issue.severity === 'error'
      ),
    [fieldValidationIssues]
  )

  useEffect(() => {
    const storeCode = listingEditorText(draft.storeCode).trim()
    const psku = listingEditorText(draft.psku).trim()
    if (!storeCode || (!psku && !barcodeForValidation)) {
      setFieldValidationIssues([])
      return
    }

    const requestSeq = ++fieldValidationRequestSeq.current
    const timer = window.setTimeout(async () => {
      try {
        const result = await validateProductListingFields(
          productListingEditorDraftToPayload(
            normalizeProductListingEditorDraft({
              ...draft,
              barcode: barcodeForValidation
            })
          )
        )
        if (fieldValidationRequestSeq.current === requestSeq) {
          setFieldValidationIssues(result.issues ?? [])
        }
      } catch {
        if (fieldValidationRequestSeq.current === requestSeq) {
          setFieldValidationIssues([])
        }
      }
    }, 350)

    return () => {
      window.clearTimeout(timer)
    }
  }, [barcodeForValidation, draft])

  const handleBarcodeDraftChange = useCallback((value: string) => {
    setBarcodeDraftForValidation(value)
  }, [])

  const {
    openCurrentProductGallery,
    patchDraft,
    updateProductAttributeField,
    updateProductMultilineField,
    updateProductSectionField,
    updateProductVariant,
    updateSiteOfferField
  } = createProductListingDetailFieldHandlers({ imageUrls, onDraftChange })
  const ai = useProductListingAiGeneration({
    draft,
    competitorMaterials: listingCompetitorMaterials,
    onPatchDraft: patchDraft
  })

  const listingPskuEditor = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '96px minmax(0, 1fr)',
        gap: 12,
        alignItems: 'center',
        width: '100%'
      }}
    >
      <Text strong style={{ color: 'var(--pm-text-primary)', whiteSpace: 'nowrap' }}>
        新增 PSKU
      </Text>
      <Input
        aria-label="新增 PSKU"
        value={draft.psku}
        placeholder="例如 NUONO-DECOR-001"
        status={pskuValidationIssue ? 'error' : undefined}
        onChange={(event) => patchDraft({ psku: event.target.value })}
      />
      {pskuValidationIssue ? (
        <>
          <span />
          <Text type="danger" style={{ fontSize: 12 }}>
            {pskuValidationIssue.message}
          </Text>
        </>
      ) : null}
    </div>
  )
  const aiPanel = (
    <div
      style={{
        border: '1px solid #dbe4ea',
        borderRadius: 8,
        padding: '10px 12px',
        background: '#fbfdff'
      }}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'flex-end' }} wrap>
          {listingCompetitorMaterials.length ? (
            <Tag color="gold" style={{ marginInlineEnd: 0 }}>
              竞品 {listingCompetitorMaterials.length}
            </Tag>
          ) : null}
          <Button
            type="primary"
            icon={<RobotOutlined />}
            loading={ai.generating}
            disabled={!ai.inputReady}
            onClick={() => void ai.generate()}
          >
            优化双语 Listing
          </Button>
        </Space>
        {ai.result ? (
          <ProductListingAiResultPreview
            applied={ai.resultApplied}
            data={ai.result}
            generating={ai.generating}
            ready={ai.resultReady}
            onApply={ai.apply}
          />
        ) : null}
      </Space>
    </div>
  )

  return (
    <ProductDetailOfficialTabs
        key={`listing-tabs-${competitorMaterialsKey}`}
        defaultActiveKey="offer"
        productSiteDomain={domains.site}
        productSharedDomainDirtyCount={0}
        currentProductSummarySurface={summary}
        productSnapshotView={snapshot}
        activeProductSiteOffer={activeSiteOffer}
        productContentDomain={domains.content}
        productContentProgressDone={contentProgress.done} productContentProgressTotal={contentProgress.total}
        productCompetitorMaterials={competitorMaterials}
        productListingKeywordSuggestions={{ EN: draft.listingKeywordSuggestionsEn, AR: draft.listingKeywordSuggestionsAr }}
        productMainDomain={domains.main}
        productImageUrls={imageUrls}
        productImageRoleAssignments={draft.imageRoleAssignments}
        productImageAssetMetadata={draft.imageAssetMetadata}
        productAttributesDomain={domains.attributes}
        productGroupingDomain={domains.grouping}
        productInsightMetrics={[]}
        productLeadImage={imageUrls[0]}
        allowEmptyImages
        offerHeaderExtra={listingPskuEditor}
        contentHeaderExtra={aiPanel}
        tabBarExtraContent={tabBarExtraContent}
        offerPresentation="listing-create"
        barcodeValidationIssue={barcodeValidationIssue}
        onBarcodeDraftChange={handleBarcodeDraftChange}
        updateSiteOfferField={updateSiteOfferField}
        updateProductSectionField={updateProductSectionField}
        updateProductMultilineField={updateProductMultilineField}
        openCurrentProductGallery={openCurrentProductGallery}
        updateProductVariant={updateProductVariant}
        removeProductVariant={() => undefined}
        updateProductAttributeField={updateProductAttributeField}
    />
  )
}
