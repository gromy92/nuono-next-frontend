import { RobotOutlined } from '@ant-design/icons'
import { Alert, Button, Col, Input, Row, Space, Tag, Typography, message } from 'antd'
import { useMemo, useState } from 'react'
import { ProductDetailOfficialTabs } from '../product-management/components/ProductDetailOfficialTabs'
import type { ProductCompetitorContentMaterial } from '../product-management/types/competitorContent'
import { generateProductListingAiListing } from './api'
import {
  productListingContentProgress,
  productListingEditorDraftDomains,
  productListingEditorDraftToPayload,
  productListingEditorDraftToSiteOffer,
  productListingEditorDraftToSnapshot,
  productListingEditorDraftToStockRows,
  productListingEditorDraftToSummary,
  normalizeProductListingEditorDraft,
  type ProductListingEditorDraft
} from './productDetailAdapter'
import type { ProductListingAiListingData, ProductListingAiListingDraft } from './types'

const { Text } = Typography

type ProductListingDetailEditorProps = {
  draft: ProductListingEditorDraft
  competitorMaterials?: ProductCompetitorContentMaterial[]
  onDraftChange: (updater: (currentDraft: ProductListingEditorDraft) => ProductListingEditorDraft) => void
}

export function ProductListingDetailEditor({ competitorMaterials = [], draft, onDraftChange }: ProductListingDetailEditorProps) {
  const [aiRequirement, setAiRequirement] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiResult, setAiResult] = useState<ProductListingAiListingData>()
  const [aiResponseWarnings, setAiResponseWarnings] = useState<string[]>([])
  const snapshot = useMemo(() => productListingEditorDraftToSnapshot(draft), [draft])
  const activeSiteOffer = useMemo(() => productListingEditorDraftToSiteOffer(draft), [draft])
  const summary = useMemo(() => productListingEditorDraftToSummary(draft), [draft])
  const domains = useMemo(() => productListingEditorDraftDomains(draft), [draft])
  const contentProgress = useMemo(() => productListingContentProgress(draft), [draft])
  const stockRows = useMemo(() => productListingEditorDraftToStockRows(draft), [draft])
  const imageUrls = useMemo(
    () => (Array.isArray(snapshot.content.images) ? snapshot.content.images.map(String).filter(Boolean) : []),
    [snapshot.content.images]
  )
  const aiInputReady = useMemo(() => hasListingAiInput(draft, competitorMaterials), [draft, competitorMaterials])

  const patchDraft = (patch: Partial<ProductListingEditorDraft>) => {
    onDraftChange((currentDraft) => normalizeProductListingEditorDraft({ ...currentDraft, ...patch }))
  }

  const generateAiListing = async () => {
    if (!aiInputReady) {
      message.warning('请先填写商品标题、类目、描述、卖点或带入竞品材料')
      return
    }
    setAiGenerating(true)
    try {
      const result = await generateProductListingAiListing({
        draft: productListingEditorDraftToPayload(draft),
        operatorRequirement: aiRequirement,
        competitorMaterials
      })
      setAiResponseWarnings(result.warnings ?? [])
      if (!result.ready || !result.data) {
        setAiResult(undefined)
        message.warning(result.message || result.msg || 'AI 未返回可用 Listing 结果')
        return
      }
      setAiResult(result.data)
      message.success('AI Listing 已生成')
    } catch (error) {
      setAiResult(undefined)
      message.error(errorMessage(error, '商品上架 AI 整合失败'))
    } finally {
      setAiGenerating(false)
    }
  }

  const applyAiListingDraft = () => {
    const uploadDraft = aiResult?.noonUploadDraft
    const patch = aiListingDraftPatch(uploadDraft)
    if (!Object.keys(patch).length) {
      message.warning('AI 结果没有可填入草稿的上架字段')
      return
    }
    patchDraft(patch)
    message.success('AI Listing 已填入草稿，请复核后保存')
  }

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
      } else if (field === 'partnerSku') {
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
    } else if (field === 'isActive') {
      patchDraft({ isActive: Boolean(value) })
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
    message.info(`${field} 暂只保留在当前页面草稿，后端上架草稿暂未接入该属性。`)
  }

  const openCurrentProductGallery = (index: number) => {
    const imageUrl = imageUrls[index]
    if (imageUrl) {
      window.open(imageUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const listingPskuEditor = (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Text strong style={{ color: 'var(--pm-text-primary)' }}>
        新增 PSKU
      </Text>
      <Input
        aria-label="新增 PSKU"
        value={draft.psku}
        placeholder="例如 NUONO-DECOR-001"
        onChange={(event) => patchDraft({ psku: event.target.value })}
      />
    </Space>
  )

  const aiPanel = (
    <div
      style={{
        border: '1px solid #dbe4ea',
        borderRadius: 8,
        padding: 16,
        background: '#fbfdff'
      }}
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <Space align="center" wrap>
            <RobotOutlined style={{ color: '#2563eb' }} />
            <Text strong style={{ color: 'var(--pm-text-primary)' }}>
              AI整合
            </Text>
            <Tag color="blue" style={{ marginInlineEnd: 0 }}>
              Noon 双语 v3.2
            </Tag>
            {competitorMaterials.length ? (
              <Tag color="gold" style={{ marginInlineEnd: 0 }}>
                竞品 {competitorMaterials.length}
              </Tag>
            ) : null}
          </Space>
          <Button
            type="primary"
            icon={<RobotOutlined />}
            loading={aiGenerating}
            disabled={!aiInputReady}
            onClick={() => void generateAiListing()}
          >
            生成双语 Listing
          </Button>
        </Space>
        <Input.TextArea
          aria-label="商品上架 AI 整合补充要求"
          value={aiRequirement}
          autoSize={{ minRows: 2, maxRows: 4 }}
          placeholder="补充运营要求、目标场景、禁写项；未填写则按 v3.2 规则和当前草稿生成"
          onChange={(event) => setAiRequirement(event.target.value)}
        />
        {aiResult ? (
          <ProductListingAiResultPreview
            data={aiResult}
            responseWarnings={aiResponseWarnings}
            onApply={applyAiListingDraft}
          />
        ) : null}
      </Space>
    </div>
  )

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {aiPanel}
      <ProductDetailOfficialTabs
        defaultActiveKey="offer"
        productSiteDomain={domains.site}
        productSharedDomainDirtyCount={0}
        productActionSubmitting={false}
        currentProductSummarySurface={summary}
        productSnapshotView={snapshot}
        activeProductSiteOffer={activeSiteOffer}
        activeSiteDirty
        activeSiteOfferCode={draft.storeCode}
        productWarehouseStockRows={stockRows}
        siteOfferColumns={[]}
        productPlatformSignals={{}}
        productPlatformRejectionReasons={[]}
        productPlatformAffectingAttributes={[]}
        productContentDomain={domains.content}
        productContentProgressDone={contentProgress.done}
        productContentProgressTotal={contentProgress.total}
        productMainDomain={domains.main}
        productImageUrls={imageUrls}
        productAttributesDomain={domains.attributes}
        productRequiredAttributeCount={0}
        productFilledRequiredAttributeCount={0}
        productGroupingDomain={domains.grouping}
        productGroupMembers={[]}
        productCandidateGroups={[]}
        productListSourceItems={[]}
        productInsightMetrics={[]}
        productLeadImage={imageUrls[0]}
        offerHeaderExtra={listingPskuEditor}
        previewProductAction={() => undefined}
        updateSiteOfferField={updateSiteOfferField}
        setActiveSiteOfferCode={() => undefined}
        updateProductSectionField={updateProductSectionField}
        updateProductMultilineField={updateProductMultilineField}
        openCurrentProductGallery={openCurrentProductGallery}
        addProductVariant={() => undefined}
        updateProductVariant={updateProductVariant}
        removeProductVariant={() => undefined}
        updateProductAxes={() => undefined}
        updateProductAttributeField={updateProductAttributeField}
      />
    </Space>
  )
}

function ProductListingAiResultPreview(props: {
  data: ProductListingAiListingData
  responseWarnings: string[]
  onApply: () => void
}) {
  const { data, onApply, responseWarnings } = props
  const qualityScore = data.qualityCheck?.score
  const needsHumanConfirmation = stringList(data.needsHumanConfirmation)
  const warnings = uniqueTexts([...responseWarnings, ...stringList(data.warnings)])
  const uploadNotes = stringList(data.qualityCheck?.uploadNotes)

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Space align="center" wrap>
        {typeof qualityScore === 'number' ? (
          <Tag color={scoreColor(qualityScore)} style={{ marginInlineEnd: 0 }}>
            质检 {qualityScore}/100
          </Tag>
        ) : null}
        {stringList(data.keywords?.english).slice(0, 6).map((keyword) => (
          <Tag key={`en-${keyword}`} color="geekblue" style={{ marginInlineEnd: 0 }}>
            {keyword}
          </Tag>
        ))}
        {stringList(data.keywords?.arabic).slice(0, 6).map((keyword) => (
          <Tag key={`ar-${keyword}`} color="cyan" style={{ marginInlineEnd: 0 }}>
            {keyword}
          </Tag>
        ))}
      </Space>

      {needsHumanConfirmation.length ? (
        <Alert
          type="warning"
          showIcon
          message="需人工确认"
          description={
            <Space wrap size={[6, 6]}>
              {needsHumanConfirmation.map((item) => (
                <Tag key={item} color="orange" style={{ marginInlineEnd: 0 }}>
                  {item}
                </Tag>
              ))}
            </Space>
          }
        />
      ) : null}

      {warnings.length || uploadNotes.length ? (
        <Alert
          type="info"
          showIcon
          message="质检提示"
          description={[...warnings, ...uploadNotes].join('；')}
        />
      ) : null}

      <Row gutter={[16, 12]}>
        <Col xs={24} lg={12}>
          <ProductListingAiLanguagePreview
            label="English"
            title={data.noonUploadDraft?.productTitleEn || data.englishListing?.title}
            bullets={data.noonUploadDraft?.productHighlightsEn || data.englishListing?.bullets}
            description={data.noonUploadDraft?.productDescriptionEn || data.englishListing?.longDescription}
          />
        </Col>
        <Col xs={24} lg={12}>
          <ProductListingAiLanguagePreview
            label="Arabic"
            title={data.noonUploadDraft?.productTitleAr || data.arabicListing?.title}
            bullets={data.noonUploadDraft?.productHighlightsAr || data.arabicListing?.bullets}
            description={data.noonUploadDraft?.productDescriptionAr || data.arabicListing?.longDescription}
          />
        </Col>
      </Row>

      <Space align="center" style={{ justifyContent: 'flex-end', width: '100%' }}>
        <Button type="primary" onClick={onApply}>
          填入草稿
        </Button>
      </Space>
    </Space>
  )
}

function ProductListingAiLanguagePreview(props: {
  label: string
  title?: string
  bullets?: string[]
  description?: string
}) {
  const { bullets, description, label, title } = props
  const cleanBullets = stringList(bullets)
  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Text strong style={{ color: 'var(--pm-text-primary)' }}>
        {label}
      </Text>
      <div>
        <Text type="secondary">标题</Text>
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          {text(title) || '-'}
        </Typography.Paragraph>
      </div>
      <div>
        <Text type="secondary">卖点</Text>
        {cleanBullets.length ? (
          <ul style={{ margin: '4px 0 0', paddingInlineStart: 18 }}>
            {cleanBullets.map((item, index) => (
              <li key={`${label}-bullet-${index}`} style={{ marginBottom: 4 }}>
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <Typography.Paragraph style={{ marginBottom: 0 }}>-</Typography.Paragraph>
        )}
      </div>
      <div>
        <Text type="secondary">长描述</Text>
        <Typography.Paragraph
          ellipsis={{ rows: 5, expandable: true, symbol: '展开' }}
          style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}
        >
          {text(description) || '-'}
        </Typography.Paragraph>
      </div>
    </Space>
  )
}

function hasListingAiInput(
  draft: ProductListingEditorDraft,
  competitorMaterials: ProductCompetitorContentMaterial[]
) {
  const draftTexts = [
    draft.productTitleCn,
    draft.productTitleEn,
    draft.productTitleAr,
    draft.productDescriptionCn,
    draft.productDescriptionEn,
    draft.productDescriptionAr,
    draft.productFullType,
    draft.family,
    draft.productType,
    draft.productSubType,
    draft.productBrand,
    ...stringList(draft.productHighlightsCn),
    ...stringList(draft.productHighlightsEn),
    ...stringList(draft.productHighlightsAr)
  ]
  return draftTexts.some((item) => text(item)) || competitorMaterials.some(hasCompetitorMaterialContent)
}

function hasCompetitorMaterialContent(material: ProductCompetitorContentMaterial) {
  return Boolean(
    text(material.titleEn) ||
      text(material.titleAr) ||
      text(material.descriptionEn) ||
      text(material.descriptionAr) ||
      stringList(material.sellingPointsEn).length ||
      stringList(material.sellingPointsAr).length
  )
}

function aiListingDraftPatch(uploadDraft?: ProductListingAiListingDraft): Partial<ProductListingEditorDraft> {
  if (!uploadDraft) {
    return {}
  }
  const patch: Partial<ProductListingEditorDraft> = {}
  const titleEn = cleanUploadText(uploadDraft.productTitleEn)
  const titleAr = cleanUploadText(uploadDraft.productTitleAr)
  const descriptionEn = cleanUploadText(uploadDraft.productDescriptionEn)
  const descriptionAr = cleanUploadText(uploadDraft.productDescriptionAr)
  const highlightsEn = cleanUploadList(uploadDraft.productHighlightsEn)
  const highlightsAr = cleanUploadList(uploadDraft.productHighlightsAr)
  if (titleEn) {
    patch.productTitleEn = titleEn
  }
  if (titleAr) {
    patch.productTitleAr = titleAr
  }
  if (descriptionEn) {
    patch.productDescriptionEn = descriptionEn
  }
  if (descriptionAr) {
    patch.productDescriptionAr = descriptionAr
  }
  if (highlightsEn.length) {
    patch.productHighlightsEn = highlightsEn
  }
  if (highlightsAr.length) {
    patch.productHighlightsAr = highlightsAr
  }
  return patch
}

function cleanUploadList(values?: string[]) {
  return stringList(values).map(cleanUploadText).filter(Boolean).slice(0, 5)
}

function cleanUploadText(value: unknown) {
  return text(value).replace(/\*\*/g, '').trim()
}

function scoreColor(score: number) {
  if (score >= 85) {
    return 'green'
  }
  if (score >= 70) {
    return 'gold'
  }
  return 'red'
}

function uniqueTexts(values: string[]) {
  return values.filter((value, index, list) => value && list.indexOf(value) === index)
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
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
