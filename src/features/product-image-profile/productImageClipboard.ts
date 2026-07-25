import type { ProductImageAiPromptSection } from './aiCopyText'
import type { ProductImageSuite } from './productImageProfileTypes'

type ClipboardFeedback = {
  error: (content: string) => void
  info: (content: string) => void
  success: (content: string) => void
  warning: (content: string) => void
}

function copyTextWithFallback(value: string) {
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)
  if (!copied) throw new Error('copy failed')
}

function copyAsync(
  value: string,
  feedback: ClipboardFeedback,
  successText: string,
  failureText: string
) {
  try {
    copyTextWithFallback(value)
    feedback.success(successText)
    return
  } catch {
    // Continue to the async clipboard API when execCommand is unavailable.
  }
  if (!navigator.clipboard?.writeText) {
    feedback.warning('当前浏览器不支持自动复制')
    return
  }
  void navigator.clipboard.writeText(value)
    .then(() => feedback.success(successText))
    .catch(() => feedback.error(failureText))
}

export function createProductImageClipboardActions(
  feedback: ClipboardFeedback,
  aiCopyText: string
) {
  const selectPskuText = (sourceElement?: HTMLElement | null) => {
    if (!sourceElement) {
      feedback.error('PSKU 复制失败')
      return
    }
    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(sourceElement)
    selection?.removeAllRanges()
    selection?.addRange(range)
    feedback.info('已选中 PSKU，可手动复制')
  }

  const copyPskuCode = (pskuCode: string, sourceElement?: HTMLElement | null) => {
    try {
      copyTextWithFallback(pskuCode)
      feedback.success('PSKU 已复制')
    } catch {
      if (!navigator.clipboard?.writeText) {
        selectPskuText(sourceElement)
        return
      }
      void navigator.clipboard.writeText(pskuCode)
        .then(() => feedback.success('PSKU 已复制'))
        .catch(() => selectPskuText(sourceElement))
    }
  }

  const copyAiCopyText = () => {
    if (!aiCopyText.trim()) {
      feedback.warning('暂无可复制文案')
      return
    }
    copyAsync(aiCopyText, feedback, 'AI 文案已复制', 'AI 文案复制失败')
  }

  const copyAiPromptSection = (section: ProductImageAiPromptSection) => {
    copyAsync(
      `【${section.copyTitle}】\n${section.text}`,
      feedback,
      `${section.title}指令已复制`,
      `${section.title}指令复制失败`
    )
  }

  const copySuiteDraftText = (suite: ProductImageSuite) => {
    const draftText = suite.draftPromptText?.trim()
    if (!draftText) {
      feedback.warning('暂无可复制草稿')
      return
    }
    copyAsync(draftText, feedback, 'AI 草稿已复制', 'AI 草稿复制失败')
  }

  return { copyAiCopyText, copyAiPromptSection, copyPskuCode, copySuiteDraftText }
}
