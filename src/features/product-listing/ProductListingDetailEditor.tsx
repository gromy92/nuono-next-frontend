import { RobotOutlined } from '@ant-design/icons'
import { Button, Input, Space, Tag, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ProductDetailOfficialTabs } from '../product-management/components/ProductDetailOfficialTabs'
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
  updateProductListingKeyAttributeField,
  type ProductListingEditorDraft
} from './productDetailAdapter'
import type { ProductCompetitorContentMaterial } from '../product-domain/productCompetitorContent'
import type { ProductListingValidationIssue } from './types'
import { useProductListingAiGeneration } from './useProductListingAiGeneration'

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
  const barcodeForValidation = text(barcodeDraftForValidation).trim() || text(draft.barcode).trim()
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
    const storeCode = text(draft.storeCode).trim()
    const psku = text(draft.psku).trim()
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

  const patchDraft = (patch: Partial<ProductListingEditorDraft>) => {
    onDraftChange((currentDraft) => normalizeProductListingEditorDraft({ ...currentDraft, ...patch }))
  }
  const ai = useProductListingAiGeneration({
    draft,
    competitorMaterials: listingCompetitorMaterials,
    onPatchDraft: patchDraft
  })

  const updateProductSectionField = (
    section: 'identity' | 'taxonomy' | 'content' | 'group',
    field: string,
    value: unknown
  ) => {
    if (section === 'identity') {
      if (field === 'brand') {
        patchDraft({ productBrand: text(value) })
      } else if (field === 'brandCode') {
        patchDraft({ productBrandCode: text(value) })
      } else if (field === 'barcode') {
        patchDraft({ barcode: text(value) })
      } else if (field === 'barcodes' && Array.isArray(value)) {
        patchDraft({ barcode: text(value[0]) })
      } else if (field === 'partnerSku' || field === 'pskuCode' || field === 'skuParent') {
        patchDraft({ psku: text(value) })
      }
      return
    }

    if (section === 'taxonomy') {
      if (field === 'productFulltype') {
        patchDraft({ productFullType: text(value) })
      } else if (field === 'family') {
        patchDraft({ family: text(value) })
      } else if (field === 'productType') {
        patchDraft({ productType: text(value) })
      } else if (field === 'productSubtype') {
        patchDraft({ productSubType: text(value) })
      }
      return
    }

    if (section === 'content') {
      if (field === 'titleCn') {
        patchDraft({ productTitleCn: text(value) })
      } else if (field === 'titleEn') {
        patchDraft({ productTitleEn: text(value) })
      } else if (field === 'titleAr') {
        patchDraft({ productTitleAr: text(value) })
      } else if (field === 'descriptionCn' || field === 'descriptionZh') {
        patchDraft({ productDescriptionCn: text(value) })
      } else if (field === 'descriptionEn') {
        patchDraft({ productDescriptionEn: text(value) })
      } else if (field === 'descriptionAr') {
        patchDraft({ productDescriptionAr: text(value) })
      } else if (field === 'highlightsZh') {
        patchDraft({ productHighlightsCn: stringList(value) })
      } else if (field === 'highlightsEn') {
        patchDraft({ productHighlightsEn: stringList(value) })
      } else if (field === 'highlightsAr') {
        patchDraft({ productHighlightsAr: stringList(value) })
      } else if (field === 'images') {
        patchDraft({ imageUrls: stringList(value) })
      } else if (field === 'imageRoleAssignments') {
        patchDraft({ imageRoleAssignments: imageRoleAssignmentList(value) })
      } else if (field === 'imageAssetMetadata') {
        patchDraft({ imageAssetMetadata: imageAssetMetadataList(value) })
      }
    }
  }

  const updateProductMultilineField = (field: 'highlightsEn' | 'highlightsAr' | 'images', value: string) => {
    if (field === 'images') {
      patchDraft({ imageUrls: multilineList(value) })
    } else if (field === 'highlightsEn') {
      patchDraft({ productHighlightsEn: multilineList(value) })
    } else {
      patchDraft({ productHighlightsAr: multilineList(value) })
    }
  }

  const updateSiteOfferField = (_storeCode: string, field: string, value: unknown) => {
    if (field === 'price') {
      patchDraft({ price: text(value) })
    } else if (field === 'priceMin') {
      patchDraft({ priceMin: text(value) })
    } else if (field === 'priceMax') {
      patchDraft({ priceMax: text(value) })
    } else if (field === 'salePrice') {
      patchDraft({ salePrice: text(value) })
    } else if (field === 'saleStart') {
      patchDraft({ saleStart: text(value) })
    } else if (field === 'saleEnd') {
      patchDraft({ saleEnd: text(value) })
    } else if (field === 'idWarranty') {
      patchDraft({ idWarranty: text(value) })
    } else if (field === 'offerNote') {
      patchDraft({ offerNote: text(value) })
    }
  }

  const updateProductVariant = (index: number, field: 'childSku' | 'sizeEn' | 'sizeAr', value: string) => {
    if (index !== 0) {
      return
    }
    if (field === 'sizeEn') {
      patchDraft({ sizeEn: value })
    } else if (field === 'sizeAr') {
      patchDraft({ sizeAr: value })
    }
  }

  const updateProductAttributeField = (code: string, field: string, value: string) => {
    if (['barcode', 'barcodes', 'ean', 'gtin', 'upc'].includes(code.toLowerCase())) {
      patchDraft({ barcode: value })
      return
    }
    onDraftChange((currentDraft) =>
      normalizeProductListingEditorDraft({
        ...currentDraft,
        keyAttributes: updateProductListingKeyAttributeField(currentDraft.keyAttributes, code, field, value)
      })
    )
  }

  const openCurrentProductGallery = (index: number) => {
    const imageUrl = imageUrls[index]
    if (imageUrl) {
      window.open(imageUrl, '_blank', 'noopener,noreferrer')
    }
  }

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

function text(value: unknown) {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

function stringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => text(item).trim()).filter(Boolean)
  }
  return []
}

function multilineList(value: string) {
  return value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function imageRoleAssignmentList(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null
      }
      const record = item as Record<string, unknown>
      const imageUrl = text(record.imageUrl).trim()
      const imageRole = text(record.imageRole).trim()
      const sortOrderValue = Number(record.sortOrder)
      if (!imageUrl || !['MAIN', 'SIZE', 'DETAIL', 'SCENE', 'PACKAGE'].includes(imageRole)) {
        return null
      }
      return {
        imageUrl,
        imageRole: imageRole as 'MAIN' | 'SIZE' | 'DETAIL' | 'SCENE' | 'PACKAGE',
        sortOrder: Number.isFinite(sortOrderValue) ? Math.trunc(sortOrderValue) : undefined
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
}

function imageAssetMetadataList(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null
      }
      const record = item as Record<string, unknown>
      const imageUrl = text(record.imageUrl).trim()
      const width = positiveNumber(record.width)
      const height = positiveNumber(record.height)
      if (!imageUrl || !width || !height) {
        return null
      }
      return {
        imageUrl,
        width,
        height,
        aspectRatio: positiveNumber(record.aspectRatio),
        noonReady: Boolean(record.noonReady),
        sourceWidth: positiveNumber(record.sourceWidth),
        sourceHeight: positiveNumber(record.sourceHeight),
        adapted: Boolean(record.adapted),
        adaptationTargetWidth: positiveNumber(record.adaptationTargetWidth),
        adaptationTargetHeight: positiveNumber(record.adaptationTargetHeight),
        sourceTooSmall: Boolean(record.sourceTooSmall)
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
}

function positiveNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}
