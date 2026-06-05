import { UploadOutlined } from '@ant-design/icons'
import { Alert, Button, List, Modal, Space, Statistic, Typography, Upload, message } from 'antd'
import { useEffect, useState } from 'react'
import {
  commitAli1688ExcelImport,
  createAli1688ExcelImportSource,
  loadAli1688ExcelImportSources,
  previewAli1688ExcelImport
} from '../api'
import type { Ali1688ExcelImportCommitResult, Ali1688ExcelImportPreview } from '../types'

const { Text } = Typography

type Ali1688ExcelImportModalProps = {
  open: boolean
  storeCode?: string
  siteCode?: string
  onClose: () => void
  onImported?: () => void | Promise<void>
}

export function Ali1688ExcelImportModal({
  open,
  storeCode,
  siteCode,
  onClose,
  onImported
}: Ali1688ExcelImportModalProps) {
  const [selectedAuthorizationId, setSelectedAuthorizationId] = useState<number>()
  const [selectedFile, setSelectedFile] = useState<File>()
  const [preview, setPreview] = useState<Ali1688ExcelImportPreview>()
  const [commitResult, setCommitResult] = useState<Ali1688ExcelImportCommitResult>()
  const [previewError, setPreviewError] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [committing, setCommitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelectedFile(undefined)
    setPreview(undefined)
    setCommitResult(undefined)
    setPreviewError(undefined)
    void ensureDefaultSource()
  }, [open, storeCode, siteCode])

  async function ensureDefaultSource() {
    setLoading(true)
    try {
      const loadedSources = await loadAli1688ExcelImportSources({ storeCode, siteCode })
      const firstSource = loadedSources.find((source) => source.authorizationId)
      if (firstSource?.authorizationId) {
        setSelectedAuthorizationId(firstSource.authorizationId)
        return firstSource.authorizationId
      }
      const createdSource = await createAli1688ExcelImportSource({
        accountLabel: '1688 Excel 本地导入',
        storeCode,
        siteCode
      })
      setSelectedAuthorizationId(createdSource.authorizationId)
      return createdSource.authorizationId
    } catch (error) {
      message.error('初始化 Excel 导入失败')
      return undefined
    } finally {
      setLoading(false)
    }
  }

  async function uploadImport() {
    if (!selectedFile) {
      message.warning('请选择 .xlsx 文件')
      return
    }
    const authorizationId = selectedAuthorizationId || await ensureDefaultSource()
    if (!authorizationId) {
      return
    }
    setPreviewing(true)
    setCommitting(false)
    setPreviewError(undefined)
    try {
      const previewResult = await previewAli1688ExcelImport({
        authorizationId,
        storeCode,
        siteCode,
        file: selectedFile
      })
      setCommitResult(undefined)
      if (previewResult.status !== 'preview_ready') {
        setPreview(previewResult)
        message.warning(previewResult.headerValidation?.message || 'Excel 校验未通过')
        return
      }
      setPreview(undefined)
      setCommitting(true)
      const result = await commitAli1688ExcelImport(previewResult.batchId, { storeCode, siteCode })
      setCommitResult(result)
      message.success(
        `Excel 导入完成：新增 ${result.counts.insertedItemCount}，更新 ${result.counts.updatedItemCount}，跳过 ${result.counts.skippedItemCount} 条货品行`
      )
      await onImported?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传 1688 Excel 失败'
      setPreviewError(errorMessage)
      message.error(errorMessage)
    } finally {
      setPreviewing(false)
      setCommitting(false)
    }
  }

  return (
    <Modal
      title="Excel 导入"
      open={open}
      onCancel={onClose}
      footer={<Button onClick={onClose}>关闭</Button>}
      destroyOnClose
      width={720}
    >
      <Space direction="vertical" size={16} className="ali1688-excel-import-modal">
        <Space wrap>
          <Upload
            accept=".xlsx"
            maxCount={1}
            beforeUpload={(file) => {
              setSelectedFile(file)
              setPreview(undefined)
              setCommitResult(undefined)
              setPreviewError(undefined)
              return false
            }}
            onRemove={() => {
              setSelectedFile(undefined)
              setPreview(undefined)
              setCommitResult(undefined)
              setPreviewError(undefined)
              return true
            }}
          >
            <Button icon={<UploadOutlined />}>选择 .xlsx</Button>
          </Upload>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            loading={loading || previewing || committing}
            disabled={!selectedFile}
            onClick={() => void uploadImport()}
          >
            上传
          </Button>
        </Space>
        {previewError ? <Alert type="error" showIcon message={previewError} /> : null}
        {preview ? (
          <div className="ali1688-excel-import-preview">
            {preview.headerValidation?.valid === false ? (
              <Alert
                type="warning"
                showIcon
                message={preview.headerValidation.message || '表头不匹配'}
                description={
                  preview.headerValidation.mismatchedHeaders?.slice(0, 5).map((header) => (
                    <div key={`${header.columnIndex}-${header.expected}`}>
                      第 {header.columnIndex} 列：应为 {header.expected || '-'}，实际为 {header.actual || '空'}
                    </div>
                  ))
                }
              />
            ) : null}
            {preview.rowErrors?.length ? (
              <div className="ali1688-excel-import-errors">
                <Alert type="warning" showIcon message={`发现 ${preview.rowErrors.length} 条行级错误`} />
                <List
                  size="small"
                  dataSource={preview.rowErrors.slice(0, 6)}
                  renderItem={(error) => (
                    <List.Item>
                      <Text>
                        {error.rowNumber ? `第 ${error.rowNumber} 行` : '文件'} · {error.fieldName || '-'} ·{' '}
                        {error.message || error.code}
                      </Text>
                    </List.Item>
                  )}
                />
              </div>
            ) : null}
          </div>
        ) : null}
        {commitResult ? (
          <div className="ali1688-excel-import-preview">
            <Alert type="success" showIcon message="导入完成，列表已刷新" />
            <div className="ali1688-excel-import-preview-stats">
              <Statistic title="新增订单" value={commitResult.counts.insertedOrderCount} />
              <Statistic title="更新订单" value={commitResult.counts.updatedOrderCount} />
              <Statistic title="不变订单" value={commitResult.counts.skippedOrderCount} />
              <Statistic title="新增货品" value={commitResult.counts.insertedItemCount} />
              <Statistic title="更新货品" value={commitResult.counts.updatedItemCount} />
              <Statistic title="不变货品" value={commitResult.counts.skippedItemCount} />
              <Statistic title="新增物流" value={commitResult.counts.insertedLogisticsCount} />
              <Statistic title="更新物流" value={commitResult.counts.updatedLogisticsCount} />
              <Statistic title="不变物流" value={commitResult.counts.skippedLogisticsCount} />
            </div>
          </div>
        ) : null}
      </Space>
    </Modal>
  )
}
