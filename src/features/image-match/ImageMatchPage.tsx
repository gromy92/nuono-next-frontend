import { App, Alert, Button, Card, Empty, Input, Segmented, Space, Typography, Upload } from 'antd'
import type { UploadFile } from 'antd'
import { ClearOutlined, PictureOutlined, RobotOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import { compareProductImages } from './api'
import { normalizeError } from '../../shared/api'
import './ImageMatchPage.css'

const { Text, Title } = Typography

type ImageSlotKey = 'original' | 'candidate'
type ImageInputMode = 'url' | 'upload'

type ImageSlotState = {
  mode: ImageInputMode
  url: string
  file?: File
}

const EMPTY_SLOT: ImageSlotState = {
  mode: 'url',
  url: ''
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_BYTES = 8 * 1024 * 1024

function isHttpImageUrl(value: string) {
  const trimmed = value.trim()
  return trimmed.startsWith('http://') || trimmed.startsWith('https://')
}

function createUploadFile(slot: ImageSlotKey, file?: File): UploadFile[] {
  if (!file) {
    return []
  }
  return [
    {
      uid: `${slot}-${file.name}-${file.lastModified}`,
      name: file.name,
      status: 'done'
    }
  ]
}

function ScoreView({ score }: { score?: number }) {
  if (score === undefined) {
    return <div className="image-match-score-placeholder">等待评分</div>
  }

  return (
    <>
      <div className="image-match-score">{score}</div>
      <Text type="secondary">相似度评分</Text>
    </>
  )
}

function ImagePreview({ slot }: { slot: ImageSlotState }) {
  const [filePreviewUrl, setFilePreviewUrl] = useState('')

  useEffect(() => {
    if (!slot.file) {
      setFilePreviewUrl('')
      return undefined
    }

    const nextUrl = URL.createObjectURL(slot.file)
    setFilePreviewUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [slot.file])

  const imageUrl = slot.mode === 'upload' ? filePreviewUrl : slot.url.trim()

  return (
    <div className="image-match-preview">
      {imageUrl ? <img src={imageUrl} alt="" /> : <Empty className="image-match-empty-preview" image={Empty.PRESENTED_IMAGE_SIMPLE} description="未选择图片" />}
    </div>
  )
}

type ImageInputCardProps = {
  title: string
  slotKey: ImageSlotKey
  slot: ImageSlotState
  disabled: boolean
  onChange: (nextSlot: ImageSlotState) => void
}

function ImageInputCard({ title, slotKey, slot, disabled, onChange }: ImageInputCardProps) {
  const { message } = App.useApp()
  const uploadFiles = useMemo(() => createUploadFile(slotKey, slot.file), [slot.file, slotKey])

  return (
    <Card className="image-match-input-card" title={title} variant="borderless">
      <div className="image-match-mode-row">
        <Segmented
          disabled={disabled}
          options={[
            { label: '图片链接', value: 'url' },
            { label: '上传图片', value: 'upload' }
          ]}
          value={slot.mode}
          onChange={(value) => onChange({ ...slot, mode: value as ImageInputMode })}
        />
      </div>

      {slot.mode === 'url' ? (
        <Input
          allowClear
          aria-label={`${title}链接`}
          disabled={disabled}
          placeholder="https://..."
          value={slot.url}
          onChange={(event) => onChange({ ...slot, url: event.target.value })}
        />
      ) : (
        <Upload.Dragger
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          beforeUpload={(file) => {
            if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
              message.error('仅支持 JPG、PNG、WEBP 图片')
              return Upload.LIST_IGNORE
            }
            if (file.size > MAX_IMAGE_BYTES) {
              message.error('图片不能超过 8MB')
              return Upload.LIST_IGNORE
            }
            onChange({ ...slot, file })
            return false
          }}
          disabled={disabled}
          fileList={uploadFiles}
          maxCount={1}
          onRemove={() => {
            onChange({ ...slot, file: undefined })
            return true
          }}
        >
          <Space direction="vertical" size={4}>
            <PictureOutlined />
            <Text>选择图片</Text>
          </Space>
        </Upload.Dragger>
      )}

      <ImagePreview slot={slot} />
    </Card>
  )
}

export function ImageMatchPage() {
  const { message } = App.useApp()
  const [originalImage, setOriginalImage] = useState<ImageSlotState>(EMPTY_SLOT)
  const [candidateImage, setCandidateImage] = useState<ImageSlotState>(EMPTY_SLOT)
  const [score, setScore] = useState<number>()
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const hasOriginalImage = originalImage.mode === 'upload' ? Boolean(originalImage.file) : Boolean(originalImage.url.trim())
  const hasCandidateImage = candidateImage.mode === 'upload' ? Boolean(candidateImage.file) : Boolean(candidateImage.url.trim())

  const reset = () => {
    setOriginalImage(EMPTY_SLOT)
    setCandidateImage(EMPTY_SLOT)
    setScore(undefined)
    setErrorMessage('')
  }

  const submit = async () => {
    setErrorMessage('')
    setScore(undefined)

    if (!hasOriginalImage || !hasCandidateImage) {
      message.warning('请先选择两张图片')
      return
    }
    if (originalImage.mode === 'url' && !isHttpImageUrl(originalImage.url)) {
      message.warning('原图链接必须以 http:// 或 https:// 开头')
      return
    }
    if (candidateImage.mode === 'url' && !isHttpImageUrl(candidateImage.url)) {
      message.warning('匹配图链接必须以 http:// 或 https:// 开头')
      return
    }

    setSubmitting(true)
    try {
      const result = await compareProductImages({
        originalImageUrl: originalImage.mode === 'url' ? originalImage.url : undefined,
        candidateImageUrl: candidateImage.mode === 'url' ? candidateImage.url : undefined,
        originalImageFile: originalImage.mode === 'upload' ? originalImage.file : undefined,
        candidateImageFile: candidateImage.mode === 'upload' ? candidateImage.file : undefined
      })
      setScore(result.similarityScore)
    } catch (error) {
      setErrorMessage(normalizeError(error, '图片匹配失败'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="image-match-page">
      <Card className="image-match-toolbar" variant="borderless">
        <div className="image-match-title">
          <RobotOutlined className="image-match-title-icon" />
          <div className="image-match-title-text">
            <Title level={4}>图片匹配</Title>
            <Text type="secondary">同款商品相似度评分</Text>
          </div>
        </div>
        <div className="image-match-action-row">
          <Button icon={<ClearOutlined />} onClick={reset} disabled={submitting}>
            清空
          </Button>
          <Button type="primary" icon={<RobotOutlined />} loading={submitting} onClick={submit}>
            评分
          </Button>
        </div>
      </Card>

      {errorMessage ? <Alert className="image-match-error" type="error" showIcon message={errorMessage} /> : null}

      <div className="image-match-layout">
        <div className="image-match-input-grid">
          <ImageInputCard title="原图" slotKey="original" slot={originalImage} disabled={submitting} onChange={setOriginalImage} />
          <ImageInputCard title="匹配图" slotKey="candidate" slot={candidateImage} disabled={submitting} onChange={setCandidateImage} />
        </div>

        <Card className="image-match-result-card" title="结果" variant="borderless">
          <ScoreView score={score} />
        </Card>
      </div>
    </div>
  )
}
