import { UploadOutlined } from '@ant-design/icons'
import { App, Button, Empty, Upload } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { uploadOperationsSkinAsset } from '../api'
import { ACCEPT_IMAGE_TYPES, MAX_IMAGE_BYTES, errorMessage, normalizeImageUrls } from '../skinPageModel'
import { OperationsSkinImage } from './OperationsSkinPreview'

export type SkinAssetsEditorProps = {
  value?: string[]
  onChange?: (value: string[]) => void
  storeCode: string
  coverImageUrl?: string
  disabled?: boolean
  onCoverImageUrlChange: (url: string) => void
}

export function SkinAssetsEditor({
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
