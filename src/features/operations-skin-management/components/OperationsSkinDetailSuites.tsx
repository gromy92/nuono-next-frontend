import { DownloadOutlined, UploadOutlined } from '@ant-design/icons'
import { App, Button, Empty, Skeleton, Space, Tag, Typography, Upload } from 'antd'
import { useState } from 'react'
import {
  fetchOperationsSkinAssetBlob, operationsSkinDownloadFilename, uploadOperationsSkinAsset
} from '../api'
import type { OperationsSkinGalleryRow } from '../skinGalleryRows'
import {
  OPERATIONS_SKIN_COMPONENT_SLOT_GROUPS, countConfiguredSkinComponents,
  findOperationsSkinComponentSlot, mergeOperationsSkinComponentSlots, skinComponentSlotKey,
  type OperationsSkinComponentSlot, type OperationsSkinComponentSlotGroup
} from '../skinDetailSuites'
import { MAX_IMAGE_BYTES, errorMessage } from '../skinPageModel'
import type { OperationsSkinComponentView } from '../types'
import { OperationsSkinComponentCompositePreview, OperationsSkinImage } from './OperationsSkinPreview'

const { Text } = Typography

export type OperationsSkinDetailSuitesProps = {
  row: OperationsSkinGalleryRow
  editable: boolean
  storeCode?: string
  components?: OperationsSkinComponentView[]
  disabled?: boolean
  loading?: boolean
  onComponentsChange?: (components: OperationsSkinComponentView[]) => void
}

export type SkinComponentSlotEditorProps = {
  component: OperationsSkinComponentView
  editable: boolean
  slot: OperationsSkinComponentSlot
  skinName?: string
  storeCode?: string
  disabled?: boolean
  onChange?: (component: OperationsSkinComponentView) => void
}

export function SkinComponentSlotEditor({
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

export function OperationsSkinDetailSuites({
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

