import { useState } from 'react'
import { message } from 'antd'
import {
  confirmInTransitImport,
  downloadInTransitImportTemplate,
  previewInTransitImport
} from './api'
import type { InTransitBatchFilters, InTransitImportPreview } from './types'

export function useInTransitImport(
  filters: InTransitBatchFilters,
  load: (filters: InTransitBatchFilters) => Promise<void>
) {
  const [importDrawerOpen, setImportDrawerOpen] = useState(false)
  const [importPreview, setImportPreview] = useState<InTransitImportPreview | null>(null)
  const [previewingImport, setPreviewingImport] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [confirmingImport, setConfirmingImport] = useState(false)

  const openImportDrawer = () => {
    setImportPreview(null)
    setImportDrawerOpen(true)
  }

  const handleImportFile = async (file: File) => {
    setPreviewingImport(true)
    try {
      const preview = await previewInTransitImport(file)
      setImportPreview(preview)
      if ((preview.errorCount ?? 0) > 0) {
        message.warning('导入预览存在错误，请修正模板后重传')
      } else {
        message.success('导入预览已生成')
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导入预览失败')
    } finally {
      setPreviewingImport(false)
    }
  }

  const handleDownloadImportTemplate = async () => {
    setDownloadingTemplate(true)
    try {
      const blob = await downloadInTransitImportTemplate()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = '在途商品导入模板.xlsx'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      message.success('导入模板已下载')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导入模板下载失败')
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const submitImportConfirm = async () => {
    if (!importPreview) {
      return
    }
    setConfirmingImport(true)
    try {
      const result = await confirmInTransitImport(importPreview.importBatchId)
      message.success(`已导入 ${result.importedBatchCount ?? 0} 个批次、${result.importedLineCount ?? 0} 条商品、${result.importedNodeCount ?? 0} 个节点`)
      setImportDrawerOpen(false)
      setImportPreview(null)
      await load(filters)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '确认导入失败')
    } finally {
      setConfirmingImport(false)
    }
  }

  return {
    importDrawerOpen,
    importPreview,
    previewingImport,
    downloadingTemplate,
    confirmingImport,
    setImportDrawerOpen,
    openImportDrawer,
    handleImportFile,
    handleDownloadImportTemplate,
    submitImportConfirm
  }
}
