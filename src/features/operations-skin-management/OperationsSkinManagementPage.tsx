import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  CloseOutlined,
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined
} from '@ant-design/icons'
import { App, Button, Drawer, Empty, Form, Image, Input, Select, Skeleton, Space, Tag, Tooltip, Typography, Upload } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { AuthSession } from '../auth/session'
import {
  createOperationsSkin,
  deleteOperationsSkin,
  fetchOperationsSkinAssetBlob,
  fetchOperationsSkinAssetPreviewUrl,
  fetchOperationsSkinDetail,
  fetchOperationsSkins,
  isOperationsSkinAssetUrl,
  operationsSkinDownloadFilename,
  updateOperationsSkin,
  updateOperationsSkinComponents,
  updateOperationsSkinStatus,
  uploadOperationsSkinAsset
} from './api'
import {
  isSystemPreviewSkin,
  resolveOperationsSkinGalleryRows,
  type OperationsSkinGalleryRow
} from './skinGalleryRows'
import { hasConfiguredSkinComponents } from './skinPreview'
import {
  HERO_MAIN_COMPONENT_SLOT_GROUP,
  HERO_MAIN_COMPONENT_SLOTS,
  OPERATIONS_SKIN_COMPONENT_SLOT_GROUPS,
  SUITE_IMAGE_COMPONENT_SLOT_GROUPS,
  countConfiguredSkinComponents,
  findOperationsSkinComponentSlot,
  mergeOperationsSkinComponentSlots,
  normalizeOperationsSkinComponentDrafts,
  skinComponentSlotKey,
  type OperationsSkinComponentSlotGroup,
  type OperationsSkinComponentSlot
} from './skinDetailSuites'
import type {
  OperationsSkinComponentView,
  OperationsSkinSaveRequest,
  OperationsSkinStatus,
  OperationsSkinView
} from './types'
import './OperationsSkinManagementPage.css'

const { Paragraph, Text } = Typography

type OperationsSkinManagementPageProps = {
  session: AuthSession
}

type StatusFilter = OperationsSkinStatus | 'ALL'

type SkinFormValues = {
  skinName: string
  status: OperationsSkinStatus
  coverImageUrl?: string
  styleDescription?: string
  config?: SkinDesignConfig
  assets?: string[]
  remark?: string
}

type SkinDesignConfig = {
  scenario?: string
  heroFramePng?: string
  heroBrandPng?: string
  heroSpecBackgroundPng?: string
  heroMainTitleBackgroundPng?: string
  detailTitleBar?: string
  detailTitleStyle?: string
  detailContentFrame?: string
  detailImageSafeArea?: string
  detailBodyText?: string
}

type ScopedSkinRows = {
  scope: string
  rows: OperationsSkinView[]
}

const STATUS_OPTIONS: Array<{ label: string; value: OperationsSkinStatus }> = [
  { label: '启用', value: 'ACTIVE' },
  { label: '停用', value: 'INACTIVE' }
]

const STATUS_FILTER_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
  { label: '全部状态', value: 'ALL' },
  ...STATUS_OPTIONS
]

const ACCEPT_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif']
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const SKIN_REMARK_PREFIX = 'SKIN_CONFIG_JSON:'

const SCENARIO_OPTIONS = [
  { label: '通用', value: '通用' },
  { label: '礼品', value: '礼品' },
  { label: '办公', value: '办公' },
  { label: '母婴', value: '母婴' },
  { label: '家居', value: '家居' },
  { label: '促销', value: '促销' }
]

const DEFAULT_SKIN_CONFIG: Required<SkinDesignConfig> = {
  scenario: '通用',
  heroFramePng: '透明 PNG，包含黄色外框和圆角，商品图生成时作为最上层框架',
  heroBrandPng: '透明 PNG，包含品牌黄色底和品牌名，不抠除 logo 白色背景',
  heroSpecBackgroundPng: '透明 PNG，深绿色圆角规格背景条，不包含规格文字',
  heroMainTitleBackgroundPng: '透明 PNG，底部主标题浅黄色背景，不包含标题文字',
  detailTitleBar: '标题背景跟主图规格条一致，深绿色圆角条',
  detailTitleStyle: '标题深绿色或白色按背景反差选择，字体与主图一致',
  detailContentFrame: '黄色外框，透明背景，内容区留白稳定',
  detailImageSafeArea: '副图商品或细节图占画面 68%-80%，不贴边',
  detailBodyText: '说明文字弱化，优先服务材质、尺寸、功能和场景信息'
}

function normalizeSkinConfig(config?: SkinDesignConfig): Required<SkinDesignConfig> {
  return {
    ...DEFAULT_SKIN_CONFIG,
    ...Object.fromEntries(
      Object.entries(config ?? {})
        .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
        .filter(([, value]) => Boolean(value))
    )
  }
}

function decodeSkinRemark(value?: string | null): { note: string; config: Required<SkinDesignConfig> } {
  const remark = (value ?? '').trim()
  if (!remark.startsWith(SKIN_REMARK_PREFIX)) {
    return { note: remark, config: normalizeSkinConfig() }
  }

  try {
    const payload = JSON.parse(remark.slice(SKIN_REMARK_PREFIX.length)) as {
      note?: string
      config?: SkinDesignConfig
    }
    return {
      note: (payload.note ?? '').trim(),
      config: normalizeSkinConfig(payload.config)
    }
  } catch {
    return { note: '', config: normalizeSkinConfig() }
  }
}

function encodeSkinRemark(note?: string, config?: SkinDesignConfig) {
  const normalizedConfig = normalizeSkinConfig(config)
  const trimmedNote = note?.trim()
  if (!trimmedNote && JSON.stringify(normalizedConfig) === JSON.stringify(DEFAULT_SKIN_CONFIG)) {
    return undefined
  }
  return `${SKIN_REMARK_PREFIX}${JSON.stringify({
    note: trimmedNote || undefined,
    config: normalizedConfig
  })}`
}

function statusTag(status: OperationsSkinStatus) {
  return status === 'ACTIVE' ? <Tag color="success">启用</Tag> : <Tag>停用</Tag>
}

function formatTime(value?: string | null) {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 19)
}

function normalizeImageUrls(urls?: Array<string | null | undefined>) {
  const seen = new Set<string>()
  return (urls ?? [])
    .map((url) => (url ?? '').trim())
    .filter((url) => {
      if (!url || seen.has(url)) {
        return false
      }
      seen.add(url)
      return true
    })
}

function skinAssets(row: OperationsSkinView) {
  return normalizeImageUrls(row.assets?.map((asset) => asset.imageUrl))
}

function skinCover(row: OperationsSkinView) {
  return (row.coverImageUrl ?? '').trim() || skinAssets(row)[0] || ''
}

function skinAssetCount(row: OperationsSkinView) {
  return skinAssets(row).length
}

function skinHeroComponentCount(row: OperationsSkinView) {
  if (typeof row.heroComponentCount === 'number') {
    return row.heroComponentCount
  }
  return countConfiguredSkinComponents(row.components, HERO_MAIN_COMPONENT_SLOTS)
}

function skinHeroComponentRequiredCount(row: OperationsSkinView) {
  return row.heroComponentRequiredCount ?? HERO_MAIN_COMPONENT_SLOTS.length
}

function skinSuiteComponentCount(row: OperationsSkinView) {
  return countConfiguredSkinComponents(
    row.components,
    SUITE_IMAGE_COMPONENT_SLOT_GROUPS.flatMap((group) => group.slots.filter((slot) => slot.required))
  )
}

function skinSuiteComponentRequiredCount() {
  return SUITE_IMAGE_COMPONENT_SLOT_GROUPS
    .flatMap((group) => group.slots.filter((slot) => slot.required))
    .length
}

function skinScenario(row: OperationsSkinView) {
  return decodeSkinRemark(row.remark).config.scenario
}

function skinNote(row: OperationsSkinView) {
  return decodeSkinRemark(row.remark).note
}

function trimOptional(value?: string) {
  const nextValue = value?.trim()
  return nextValue || undefined
}

function buildSaveRequest(storeCode: string, values: SkinFormValues): OperationsSkinSaveRequest {
  const assets = normalizeImageUrls(values.assets)
  const coverImageUrl = trimOptional(values.coverImageUrl) || assets[0]
  return {
    storeCode,
    skinName: values.skinName.trim(),
    status: values.status,
    coverImageUrl,
    styleDescription: trimOptional(values.styleDescription),
    remark: encodeSkinRemark(values.remark, values.config),
    assets: assets.map((imageUrl, index) => ({ imageUrl, sortOrder: index }))
  }
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

type OperationsSkinImageProps = {
  src: string
  alt: string
  width: number
  height: number
  className?: string
}

function OperationsSkinImage({ src, alt, width, height, className }: OperationsSkinImageProps) {
  const [previewSrc, setPreviewSrc] = useState(src)

  useEffect(() => {
    setPreviewSrc(src)
    if (!isOperationsSkinAssetUrl(src)) {
      return undefined
    }

    let activeObjectUrl = ''
    let cancelled = false
    const controller = new AbortController()
    void fetchOperationsSkinAssetPreviewUrl(src, controller.signal)
      .then((objectUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(objectUrl)
          return
        }
        activeObjectUrl = objectUrl
        setPreviewSrc(objectUrl)
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewSrc(src)
        }
      })

    return () => {
      cancelled = true
      controller.abort()
      if (activeObjectUrl) {
        URL.revokeObjectURL(activeObjectUrl)
      }
    }
  }, [src])

  return <Image className={className} src={previewSrc} alt={alt} width={width} height={height} />
}

type OperationsSkinLayerImageProps = {
  src: string
  alt: string
}

function OperationsSkinLayerImage({ src, alt }: OperationsSkinLayerImageProps) {
  const [previewSrc, setPreviewSrc] = useState(src)

  useEffect(() => {
    setPreviewSrc(src)
    if (!isOperationsSkinAssetUrl(src)) {
      return undefined
    }

    let activeObjectUrl = ''
    let cancelled = false
    const controller = new AbortController()
    void fetchOperationsSkinAssetPreviewUrl(src, controller.signal)
      .then((objectUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(objectUrl)
          return
        }
        activeObjectUrl = objectUrl
        setPreviewSrc(objectUrl)
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewSrc(src)
        }
      })

    return () => {
      cancelled = true
      controller.abort()
      if (activeObjectUrl) {
        URL.revokeObjectURL(activeObjectUrl)
      }
    }
  }, [src])

  return <img src={previewSrc} alt={alt} draggable={false} />
}

type OperationsSkinComponentCompositePreviewProps = {
  components?: OperationsSkinComponentView[] | null
  compact?: boolean
  emptyText?: string
  templateRole?: string
}

function OperationsSkinComponentCompositePreview({
  components,
  compact,
  emptyText = '未配置组件',
  templateRole = HERO_MAIN_COMPONENT_SLOT_GROUP.templateRole
}: OperationsSkinComponentCompositePreviewProps) {
  const layers = mergeOperationsSkinComponentSlots(components)
    .filter((component) => component.templateRole === templateRole)
    .filter((component) => component.imageUrl?.trim())
    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))

  if (!layers.length) {
    return (
      <div className={`operations-skin-component-preview operations-skin-component-preview--empty${compact ? ' operations-skin-component-preview--compact' : ''}`}>
        <Text type="secondary">{emptyText}</Text>
      </div>
    )
  }

  return (
    <div className={`operations-skin-component-preview${compact ? ' operations-skin-component-preview--compact' : ''}`}>
      <div className="operations-skin-component-canvas">
        {layers.map((component) => {
          const imageUrl = component.imageUrl?.trim()
          if (!imageUrl) return null
          return (
            <div
              className="operations-skin-component-layer"
              key={component.componentKey}
              style={{
                left: `${((component.x ?? 0) / 1247) * 100}%`,
                top: `${((component.y ?? 0) / 1706) * 100}%`,
                width: `${((component.width ?? 0) / 1247) * 100}%`,
                height: `${((component.height ?? 0) / 1706) * 100}%`,
                zIndex: component.zIndex ?? 0
              }}
            >
              <OperationsSkinLayerImage src={imageUrl} alt={component.componentKey} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

type OperationsSkinPreviewProps = {
  row: OperationsSkinGalleryRow
}

function OperationsSkinPreview({ row }: OperationsSkinPreviewProps) {
  if (hasConfiguredSkinComponents(row)) {
    return (
      <div className="operations-skin-card-preview operations-skin-card-preview--image">
        <OperationsSkinComponentCompositePreview components={row.components} compact />
      </div>
    )
  }
  const cover = skinCover(row)
  if (cover) {
    return (
      <div className="operations-skin-card-preview operations-skin-card-preview--image">
        <OperationsSkinImage src={cover} alt={row.skinName} width={220} height={260} />
      </div>
    )
  }

  return (
    <div className={`operations-skin-card-preview operations-skin-card-preview--${row.previewTone}`} aria-hidden="true">
      <div className="operations-skin-preview-device">
        <div className="operations-skin-preview-topbar" />
        <div className="operations-skin-preview-subject" />
        <div className="operations-skin-preview-shelf">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )
}

type SkinAssetsEditorProps = {
  value?: string[]
  onChange?: (value: string[]) => void
  storeCode: string
  coverImageUrl?: string
  disabled?: boolean
  onCoverImageUrlChange: (url: string) => void
}

function SkinAssetsEditor({
  value,
  onChange,
  storeCode,
  coverImageUrl,
  disabled,
  onCoverImageUrlChange
}: SkinAssetsEditorProps) {
  const { message } = App.useApp()
  const [uploading, setUploading] = useState(false)
  const uploadRequestIdRef = useRef(0)
  const latestStoreCodeRef = useRef(storeCode)
  const assetUrls = normalizeImageUrls(value)
  const currentCover = (coverImageUrl ?? '').trim()
  latestStoreCodeRef.current = storeCode

  useEffect(() => {
    uploadRequestIdRef.current += 1
    setUploading(false)
  }, [storeCode])

  const updateAssets = (nextUrls: string[]) => {
    onChange?.(normalizeImageUrls(nextUrls))
  }

  const uploadAsset = async (file: File) => {
    const actionStoreCode = storeCode
    const actionId = uploadRequestIdRef.current + 1
    uploadRequestIdRef.current = actionId
    if (!ACCEPT_IMAGE_TYPES.includes(file.type)) {
      message.warning('仅支持 JPG、PNG、GIF、WEBP、AVIF 图片')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      message.warning('参考图不能超过 8MB')
      return
    }

    setUploading(true)
    try {
      const payload = await uploadOperationsSkinAsset(actionStoreCode, file)
      if (latestStoreCodeRef.current !== actionStoreCode || uploadRequestIdRef.current !== actionId) return
      const nextUrl = payload.url?.trim()
      if (!nextUrl) {
        throw new Error('上传接口未返回图片 URL')
      }
      updateAssets([...assetUrls, nextUrl])
      if (!currentCover) {
        onCoverImageUrlChange(nextUrl)
      }
      message.success('参考图已上传')
    } catch (error) {
      if (latestStoreCodeRef.current === actionStoreCode && uploadRequestIdRef.current === actionId) {
        message.error(errorMessage(error, '参考图上传失败'))
      }
    } finally {
      if (uploadRequestIdRef.current === actionId) {
        setUploading(false)
      }
    }
  }

  const removeAsset = (url: string) => {
    const nextUrls = assetUrls.filter((item) => item !== url)
    updateAssets(nextUrls)
    if (currentCover === url) {
      onCoverImageUrlChange(nextUrls[0] || '')
    }
  }

  return (
    <div className="operations-skin-assets-editor">
      <Upload
        accept={ACCEPT_IMAGE_TYPES.join(',')}
        beforeUpload={(file) => {
          void uploadAsset(file)
          return Upload.LIST_IGNORE
        }}
        disabled={disabled || uploading}
        showUploadList={false}
      >
        <Button icon={<UploadOutlined />} loading={uploading} disabled={disabled}>
          上传参考图
        </Button>
      </Upload>

      {assetUrls.length ? (
        <div className="operations-skin-asset-grid">
          {assetUrls.map((url) => (
            <div className="operations-skin-asset-item" key={url}>
              <OperationsSkinImage src={url} alt="参考图" width={88} height={88} />
              <div className="operations-skin-asset-actions">
                <Button
                  size="small"
                  type={currentCover === url ? 'primary' : 'default'}
                  disabled={disabled}
                  onClick={() => onCoverImageUrlChange(url)}
                >
                  封面
                </Button>
                <Button size="small" danger disabled={disabled} onClick={() => removeAsset(url)}>
                  移除
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无参考图" />
      )}
    </div>
  )
}

type OperationsSkinCardProps = {
  row: OperationsSkinGalleryRow
  statusUpdating: boolean
  deleting: boolean
  onEdit: (row: OperationsSkinGalleryRow) => void
  onToggleStatus: (row: OperationsSkinView) => void
  onDelete: (row: OperationsSkinView) => void
}

function OperationsSkinCard({ row, statusUpdating, deleting, onEdit, onToggleStatus, onDelete }: OperationsSkinCardProps) {
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

type OperationsSkinDetailSuitesProps = {
  row: OperationsSkinGalleryRow
  editable: boolean
  storeCode?: string
  components?: OperationsSkinComponentView[]
  disabled?: boolean
  loading?: boolean
  onComponentsChange?: (components: OperationsSkinComponentView[]) => void
}

type SkinComponentSlotEditorProps = {
  component: OperationsSkinComponentView
  editable: boolean
  slot: OperationsSkinComponentSlot
  skinName?: string
  storeCode?: string
  disabled?: boolean
  onChange?: (component: OperationsSkinComponentView) => void
}

function SkinComponentSlotEditor({
  component,
  editable,
  slot,
  skinName,
  storeCode,
  disabled,
  onChange
}: SkinComponentSlotEditorProps) {
  const { message } = App.useApp()
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const imageUrl = component.imageUrl?.trim()

  const uploadComponent = async (file: File) => {
    if (!storeCode) return
    if (file.type !== 'image/png' && !file.name.toLowerCase().endsWith('.png')) {
      message.warning('皮肤组件只支持 PNG')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      message.warning('组件图片不能超过 8MB')
      return
    }
    setUploading(true)
    try {
      const payload = await uploadOperationsSkinAsset(storeCode, file)
      const nextUrl = payload.url?.trim()
      if (!nextUrl) {
        throw new Error('上传接口未返回图片 URL')
      }
      onChange?.({ ...component, imageUrl: nextUrl })
      message.success('组件已上传')
    } catch (error) {
      message.error(errorMessage(error, '组件上传失败'))
    } finally {
      setUploading(false)
    }
  }

  const downloadComponent = async () => {
    if (!imageUrl) return
    setDownloading(true)
    let objectUrl = ''
    try {
      const blob = await fetchOperationsSkinAssetBlob(imageUrl)
      objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = operationsSkinDownloadFilename(skinName || '皮肤', slot.label, imageUrl)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      message.success('组件已开始下载')
    } catch (error) {
      message.error(errorMessage(error, '组件下载失败'))
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
      setDownloading(false)
    }
  }

  return (
    <div
      className="operations-skin-component-slot"
      data-component-key={component.componentKey}
      data-template-role={component.templateRole}
    >
      <div className="operations-skin-component-slot-head">
        <Text strong>{slot.label}</Text>
        <Tag color={imageUrl ? 'success' : slot.required ? 'warning' : undefined}>
          {imageUrl ? '已配置' : slot.required ? '待配置' : '可选'}
        </Tag>
      </div>
      <Text type="secondary" className="operations-skin-component-slot-desc">
        {slot.description}
      </Text>
      <div className="operations-skin-component-slot-preview">
        {imageUrl ? (
          <OperationsSkinImage src={imageUrl} alt={slot.label} width={160} height={92} />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未上传" />
        )}
      </div>
      {editable || imageUrl ? (
        <Space wrap>
          <Button
            disabled={disabled || !imageUrl}
            icon={<DownloadOutlined />}
            loading={downloading}
            onClick={() => void downloadComponent()}
          >
            下载
          </Button>
          {editable ? (
            <>
              <Upload
                accept="image/png"
                beforeUpload={(file) => {
                  void uploadComponent(file)
                  return Upload.LIST_IGNORE
                }}
                disabled={disabled || uploading}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />} loading={uploading} disabled={disabled}>
                  上传 PNG
                </Button>
              </Upload>
              <Button
                disabled={disabled || !imageUrl}
                onClick={() => onChange?.({ ...component, imageUrl: '' })}
              >
                清空
              </Button>
            </>
          ) : null}
        </Space>
      ) : null}
    </div>
  )
}

function OperationsSkinDetailSuites({
  row,
  editable,
  storeCode,
  components,
  disabled,
  loading,
  onComponentsChange
}: OperationsSkinDetailSuitesProps) {
  const draftComponents = mergeOperationsSkinComponentSlots(components ?? row.components)

  const updateComponent = (nextComponent: OperationsSkinComponentView) => {
    onComponentsChange?.(
      draftComponents.map((component) =>
        skinComponentSlotKey(component) === skinComponentSlotKey(nextComponent) ? nextComponent : component
      )
    )
  }

  const componentsForGroup = (group: OperationsSkinComponentSlotGroup) =>
    draftComponents.filter((component) => component.templateRole === group.templateRole)

  const requiredSlotsForGroup = (group: OperationsSkinComponentSlotGroup) =>
    group.slots.filter((slot) => slot.required)

  const configuredCountForGroup = (group: OperationsSkinComponentSlotGroup) =>
    countConfiguredSkinComponents(componentsForGroup(group), requiredSlotsForGroup(group))

  const renderComponentEditors = (group: OperationsSkinComponentSlotGroup) => (
    <div className="operations-skin-component-slot-grid">
      {componentsForGroup(group).map((component) => {
        const slot = findOperationsSkinComponentSlot(component)
        if (!slot) return null
        return (
          <SkinComponentSlotEditor
            component={component}
            disabled={disabled || loading}
            editable={editable}
            key={skinComponentSlotKey(component)}
            onChange={updateComponent}
            skinName={row.skinName}
            slot={slot}
            storeCode={storeCode}
          />
        )
      })}
    </div>
  )

  const renderPreview = (group: OperationsSkinComponentSlotGroup) => {
    const requiredSlots = requiredSlotsForGroup(group)
    const configuredCount = configuredCountForGroup(group)
    return (
      <section className="operations-skin-template-preview-panel" key={group.templateRole}>
        <div className="operations-skin-suite-title-row">
          <Text strong>{group.name}预览</Text>
          <Tag color={configuredCount === requiredSlots.length ? 'success' : 'warning'}>
            {configuredCount}/{requiredSlots.length}
          </Tag>
        </div>
        {loading ? (
          <Skeleton.Image active className="operations-skin-component-preview-skeleton" />
        ) : (
          <OperationsSkinComponentCompositePreview
            components={draftComponents}
            emptyText={`未配置${group.name}组件`}
            templateRole={group.templateRole}
          />
        )}
      </section>
    )
  }

  const renderConfig = (group: OperationsSkinComponentSlotGroup) => (
    <section className="operations-skin-config-panel" key={group.templateRole}>
      <div className="operations-skin-config-head">
        <Text strong>{group.name}组件</Text>
        <Text type="secondary">{group.summary}</Text>
      </div>
      {renderComponentEditors(group)}
    </section>
  )

  return (
    <div className="operations-skin-suite-editor">
      <div className="operations-skin-preview-column">
        {OPERATIONS_SKIN_COMPONENT_SLOT_GROUPS.map(renderPreview)}
      </div>

      <div className="operations-skin-config-column">
        {OPERATIONS_SKIN_COMPONENT_SLOT_GROUPS.map(renderConfig)}
      </div>
    </div>
  )
}

function OperationsSkinGallerySkeleton() {
  return (
    <div className="operations-skin-gallery">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="operations-skin-card operations-skin-card--loading" key={index}>
          <Skeleton.Image active className="operations-skin-card-skeleton-image" />
          <Skeleton active paragraph={{ rows: 3 }} title={{ width: '60%' }} />
        </div>
      ))}
    </div>
  )
}

export function OperationsSkinManagementPage({ session }: OperationsSkinManagementPageProps) {
  const { message, modal } = App.useApp()
  const [form] = Form.useForm<SkinFormValues>()
  const currentStore = session.currentStore
  const storeCode = currentStore?.storeCode
  const watchedCoverImageUrl = Form.useWatch('coverImageUrl', form)
  const [scopedRows, setScopedRows] = useState<ScopedSkinRows>({ scope: '', rows: [] })
  const [loading, setLoading] = useState(false)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerStoreCode, setDrawerStoreCode] = useState<string>()
  const [editingSkin, setEditingSkin] = useState<OperationsSkinGalleryRow | null>(null)
  const [componentDrafts, setComponentDrafts] = useState<OperationsSkinComponentView[]>(() => mergeOperationsSkinComponentSlots())
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState<number>()
  const [deletingId, setDeletingId] = useState<number>()
  const loadRequestIdRef = useRef(0)
  const detailRequestIdRef = useRef(0)
  const saveRequestIdRef = useRef(0)
  const statusActionIdRef = useRef(0)
  const deleteActionIdRef = useRef(0)
  const latestStoreCodeRef = useRef<string | undefined>(storeCode)
  const latestLoadScopeRef = useRef('')
  const deleteConfirmRefs = useRef(new Set<ReturnType<typeof modal.confirm>>())
  const loadScope = `${storeCode ?? ''}\u0000${statusFilter}\u0000${keyword}`
  const rows = scopedRows.scope === loadScope ? scopedRows.rows : []
  const visibleDrawerOpen = drawerOpen && drawerStoreCode === storeCode
  latestStoreCodeRef.current = storeCode
  latestLoadScopeRef.current = loadScope

  useEffect(() => {
    loadRequestIdRef.current += 1
    detailRequestIdRef.current += 1
    saveRequestIdRef.current += 1
    statusActionIdRef.current += 1
    deleteActionIdRef.current += 1
    deleteConfirmRefs.current.forEach((confirm) => confirm.destroy())
    deleteConfirmRefs.current.clear()
    setScopedRows({ scope: '', rows: [] })
    setLoading(false)
    setDrawerOpen(false)
    setDrawerStoreCode(undefined)
    setEditingSkin(null)
    setComponentDrafts(mergeOperationsSkinComponentSlots())
    setDetailLoading(false)
    form.resetFields()
    setSaving(false)
    setStatusUpdatingId(undefined)
    setDeletingId(undefined)
  }, [form, storeCode])

  const loadSkins = useCallback(async () => {
    const requestStoreCode = storeCode
    const requestScope = `${requestStoreCode ?? ''}\u0000${statusFilter}\u0000${keyword}`
    const requestId = loadRequestIdRef.current + 1
    loadRequestIdRef.current = requestId
    const isCurrentRequest = () =>
      loadRequestIdRef.current === requestId &&
      latestStoreCodeRef.current === requestStoreCode &&
      latestLoadScopeRef.current === requestScope

    if (!requestStoreCode) {
      setScopedRows({ scope: '', rows: [] })
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const nextRows = await fetchOperationsSkins({
        storeCode: requestStoreCode,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        keyword
      })
      if (isCurrentRequest()) {
        setScopedRows({ scope: requestScope, rows: nextRows })
      }
    } catch (error) {
      if (isCurrentRequest()) {
        setScopedRows({ scope: requestScope, rows: [] })
        message.error(errorMessage(error, '皮肤列表读取失败'))
      }
    } finally {
      if (isCurrentRequest()) {
        setLoading(false)
      }
    }
  }, [keyword, message, statusFilter, storeCode])

  useEffect(() => {
    void loadSkins()
  }, [loadSkins])

  const openCreateDrawer = () => {
    if (!storeCode) return
    detailRequestIdRef.current += 1
    setEditingSkin(null)
    setComponentDrafts(mergeOperationsSkinComponentSlots())
    setDetailLoading(false)
    setDrawerStoreCode(storeCode)
    form.setFieldsValue({
      skinName: '',
      status: 'ACTIVE',
      coverImageUrl: '',
      styleDescription: '',
      config: normalizeSkinConfig(),
      assets: [],
      remark: ''
    })
    setDrawerOpen(true)
  }

  const openEditDrawer = (row: OperationsSkinGalleryRow) => {
    if (!storeCode) return
    const requestStoreCode = storeCode
    const requestId = detailRequestIdRef.current + 1
    detailRequestIdRef.current = requestId
    const decodedRemark = decodeSkinRemark(row.remark)
    setEditingSkin(row)
    setComponentDrafts(mergeOperationsSkinComponentSlots(row.components))
    setDrawerStoreCode(storeCode)
    form.setFieldsValue({
      skinName: row.skinName,
      status: row.status,
      coverImageUrl: row.coverImageUrl ?? '',
      styleDescription: row.styleDescription ?? '',
      config: decodedRemark.config,
      assets: skinAssets(row),
      remark: decodedRemark.note
    })
    setDrawerOpen(true)
    if (isSystemPreviewSkin(row)) {
      setDetailLoading(false)
      return
    }
    setDetailLoading(true)
    void fetchOperationsSkinDetail(row.id, requestStoreCode)
      .then((detail) => {
        if (latestStoreCodeRef.current !== requestStoreCode || detailRequestIdRef.current !== requestId) return
        const detailRemark = decodeSkinRemark(detail.remark)
        setEditingSkin({
          ...detail,
          source: 'store',
          previewTone: row.previewTone
        })
        setComponentDrafts(mergeOperationsSkinComponentSlots(detail.components))
        form.setFieldsValue({
          skinName: detail.skinName,
          status: detail.status,
          coverImageUrl: detail.coverImageUrl ?? '',
          styleDescription: detail.styleDescription ?? '',
          config: detailRemark.config,
          assets: skinAssets(detail),
          remark: detailRemark.note
        })
      })
      .catch((error) => {
        if (latestStoreCodeRef.current === requestStoreCode && detailRequestIdRef.current === requestId) {
          message.error(errorMessage(error, '皮肤详情读取失败'))
        }
      })
      .finally(() => {
        if (detailRequestIdRef.current === requestId) {
          setDetailLoading(false)
        }
      })
  }

  const closeDrawer = () => {
    if (saving) return
    detailRequestIdRef.current += 1
    setDetailLoading(false)
    setDrawerOpen(false)
    setDrawerStoreCode(undefined)
  }

  const submitDrawer = async () => {
    if (!storeCode || drawerStoreCode !== storeCode) return
    if (editingSkin && isSystemPreviewSkin(editingSkin)) {
      message.info('系统预设皮肤接入后端后可保存')
      return
    }
    const actionStoreCode = storeCode
    const actionId = saveRequestIdRef.current + 1
    saveRequestIdRef.current = actionId
    let values: SkinFormValues
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    if (latestStoreCodeRef.current !== actionStoreCode || saveRequestIdRef.current !== actionId) return
    const request = buildSaveRequest(actionStoreCode, values)
    setSaving(true)
    try {
      let savedSkin: OperationsSkinView
      if (editingSkin) {
        savedSkin = await updateOperationsSkin(editingSkin.id, request)
        if (latestStoreCodeRef.current !== actionStoreCode || saveRequestIdRef.current !== actionId) return
      } else {
        savedSkin = await createOperationsSkin(request)
        if (latestStoreCodeRef.current !== actionStoreCode || saveRequestIdRef.current !== actionId) return
      }
      await updateOperationsSkinComponents(savedSkin.id, {
        storeCode: actionStoreCode,
        components: normalizeOperationsSkinComponentDrafts(componentDrafts)
      })
      if (latestStoreCodeRef.current !== actionStoreCode || saveRequestIdRef.current !== actionId) return
      message.success(editingSkin ? '皮肤已保存' : '皮肤已新增')
      setDrawerOpen(false)
      setDrawerStoreCode(undefined)
      await loadSkins()
    } catch (error) {
      if (latestStoreCodeRef.current === actionStoreCode && saveRequestIdRef.current === actionId) {
        message.error(errorMessage(error, '皮肤保存失败'))
      }
    } finally {
      if (saveRequestIdRef.current === actionId) {
        setSaving(false)
      }
    }
  }

  const toggleStatus = async (row: OperationsSkinView) => {
    if (!storeCode) return
    const actionStoreCode = storeCode
    const actionId = statusActionIdRef.current + 1
    statusActionIdRef.current = actionId
    const nextStatus: OperationsSkinStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    setStatusUpdatingId(row.id)
    try {
      await updateOperationsSkinStatus(row.id, { storeCode: actionStoreCode, status: nextStatus })
      if (latestStoreCodeRef.current !== actionStoreCode || statusActionIdRef.current !== actionId) return
      message.success(nextStatus === 'ACTIVE' ? '皮肤已启用' : '皮肤已停用')
      await loadSkins()
    } catch (error) {
      if (latestStoreCodeRef.current === actionStoreCode && statusActionIdRef.current === actionId) {
        message.error(errorMessage(error, '皮肤状态更新失败'))
      }
    } finally {
      if (statusActionIdRef.current === actionId) {
        setStatusUpdatingId(undefined)
      }
    }
  }

  const requestDelete = (row: OperationsSkinView) => {
    if (!storeCode) return
    const actionStoreCode = storeCode
    const confirm = modal.confirm({
      title: '删除皮肤',
      content: `确认删除“${row.skinName}”？删除后不能在列表中恢复。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onCancel: () => {
        deleteConfirmRefs.current.delete(confirm)
      },
      onOk: async () => {
        if (latestStoreCodeRef.current !== actionStoreCode) {
          deleteConfirmRefs.current.delete(confirm)
          return
        }
        const actionId = deleteActionIdRef.current + 1
        deleteActionIdRef.current = actionId
        setDeletingId(row.id)
        try {
          await deleteOperationsSkin(row.id, actionStoreCode)
          if (latestStoreCodeRef.current !== actionStoreCode || deleteActionIdRef.current !== actionId) return
          message.success('皮肤已删除')
          await loadSkins()
        } catch (error) {
          if (latestStoreCodeRef.current === actionStoreCode && deleteActionIdRef.current === actionId) {
            message.error(errorMessage(error, '皮肤删除失败'))
          }
        } finally {
          if (deleteActionIdRef.current === actionId) {
            setDeletingId(undefined)
          }
          deleteConfirmRefs.current.delete(confirm)
        }
      }
    })
    deleteConfirmRefs.current.add(confirm)
  }

  const galleryRows = resolveOperationsSkinGalleryRows({
    rows,
    storeCode,
    keyword,
    status: statusFilter
  })
  const showInitialLoading = loading && scopedRows.scope !== loadScope
  const editingSystemPreview = editingSkin ? isSystemPreviewSkin(editingSkin) : false
  const drawerSkinRow: OperationsSkinGalleryRow | null = editingSkin || (storeCode ? {
    id: -9999,
    storeCode,
    skinName: '新皮肤',
    status: 'ACTIVE',
    coverImageUrl: null,
    styleDescription: '',
    remark: '',
    assets: [],
    updatedAt: null,
    source: 'system-preview',
    previewTone: 'studio'
  } : null)

  const content = storeCode ? (
    <>
      <div className="operations-skin-toolbar">
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="搜索皮肤名称 / 备注"
            value={keywordInput}
            onChange={(event) => {
              setKeywordInput(event.target.value)
              if (!event.target.value) {
                setKeyword('')
              }
            }}
            onSearch={(value) => setKeyword(value.trim())}
            className="operations-skin-search"
          />
          <Select<StatusFilter>
            value={statusFilter}
            options={STATUS_FILTER_OPTIONS}
            onChange={setStatusFilter}
            className="operations-skin-status-filter"
          />
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void loadSkins()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDrawer}>
            新增皮肤
          </Button>
        </Space>
      </div>

      <div className="operations-skin-gallery-shell">
        {showInitialLoading ? (
          <OperationsSkinGallerySkeleton />
        ) : galleryRows.length ? (
          <div className="operations-skin-gallery">
            {galleryRows.map((row) => (
              <OperationsSkinCard
                key={row.id}
                row={row}
                statusUpdating={statusUpdatingId === row.id}
                deleting={deletingId === row.id}
                onEdit={openEditDrawer}
                onToggleStatus={(nextRow) => void toggleStatus(nextRow)}
                onDelete={requestDelete}
              />
            ))}
          </div>
        ) : (
          <div className="operations-skin-empty-panel">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无皮肤" />
          </div>
        )}
      </div>
    </>
  ) : (
    <div className="operations-skin-empty-panel">
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请先在右上角选择店铺" />
    </div>
  )

  return (
    <div className="operations-skin-page">
      {content}

      <Drawer
        title={editingSkin ? '皮肤详情' : '新增皮肤'}
        open={visibleDrawerOpen}
        width="80vw"
        closable={false}
        onClose={closeDrawer}
        extra={
          editingSystemPreview ? (
            <Button icon={<CloseOutlined />} onClick={closeDrawer}>关闭</Button>
          ) : (
            <Space>
              <Button type="primary" loading={saving} onClick={() => void submitDrawer()}>
                保存
              </Button>
              <Button icon={<CloseOutlined />} onClick={closeDrawer} disabled={saving}>
                关闭
              </Button>
            </Space>
          )
        }
      >
        {editingSystemPreview && editingSkin ? (
          <OperationsSkinDetailSuites
            components={componentDrafts}
            editable={false}
            loading={detailLoading}
            row={editingSkin}
            storeCode={storeCode}
          />
        ) : null}

        {!editingSystemPreview ? (
          <Form<SkinFormValues> form={form} layout="vertical">
            <div className="operations-skin-basic-form">
              <Form.Item name="skinName" label="皮肤名称" rules={[{ required: true, whitespace: true, message: '请输入皮肤名称' }]}>
                <Input maxLength={80} placeholder="例如：PAPERSAY 黄框品牌风" />
              </Form.Item>

              <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
                <Select options={STATUS_OPTIONS} />
              </Form.Item>

              <Form.Item name="coverImageUrl" hidden>
                <Input />
              </Form.Item>

              <Form.Item name="styleDescription" label="套系描述">
                <Input.TextArea rows={2} maxLength={300} placeholder="例如：黄框品牌型，适合文具、办公和礼品类商品图" />
              </Form.Item>
            </div>

            {drawerSkinRow ? (
              <OperationsSkinDetailSuites
                components={componentDrafts}
                disabled={saving || !storeCode}
                editable
                loading={detailLoading}
                onComponentsChange={setComponentDrafts}
                row={drawerSkinRow}
                storeCode={storeCode}
              />
            ) : null}

            <div className="operations-skin-assets-panel">
              <Form.Item name="assets" label="参考图素材">
                <SkinAssetsEditor
                  storeCode={storeCode || ''}
                  coverImageUrl={watchedCoverImageUrl}
                  disabled={saving || !storeCode}
                  onCoverImageUrlChange={(url) => form.setFieldValue('coverImageUrl', url)}
                />
              </Form.Item>

              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} maxLength={300} placeholder="内部备注" />
              </Form.Item>
            </div>

          </Form>
        ) : null}
      </Drawer>
    </div>
  )
}
