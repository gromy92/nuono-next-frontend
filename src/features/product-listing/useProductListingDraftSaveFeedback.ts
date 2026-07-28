import { message } from 'antd'
import { useState } from 'react'
import { normalizeError } from '../../shared/api'
import type { ProductListingNotice } from './ProductListingPageStatus'
import type { ProductListingDraftView } from './types'

const MESSAGE_KEY = 'product-listing-draft-save'
const WORKFLOW_REFRESH_WARNING =
  '草稿已保存，但暂时无法读取最新上架状态，请刷新页面后再继续。'

export function useProductListingDraftSaveFeedback() {
  const [notice, setNotice] = useState<ProductListingNotice>()

  return {
    notice,
    start(silent?: boolean) {
      if (silent) return
      setNotice({ type: 'info', message: '正在保存上架草稿...' })
      message.loading({
        key: MESSAGE_KEY,
        content: '正在保存上架草稿...',
        duration: 0
      })
    },
    success(saved: ProductListingDraftView, silent?: boolean) {
      if (silent) return
      const successMessage = saved.draftNo
        ? `上架草稿已保存：${saved.draftNo}`
        : '上架草稿已保存'
      setNotice({ type: 'success', message: successMessage })
      message.success({ key: MESSAGE_KEY, content: successMessage })
    },
    failure(error: unknown, silent?: boolean) {
      const errorMessage = normalizeError(error, '保存上架草稿失败')
      if (silent) {
        message.error(errorMessage)
        return
      }
      setNotice({ type: 'error', message: errorMessage })
      message.error({ key: MESSAGE_KEY, content: errorMessage })
    },
    workflowRefreshFailure(silent?: boolean) {
      if (!silent) {
        setNotice({ type: 'warning', message: WORKFLOW_REFRESH_WARNING })
        message.warning({
          key: MESSAGE_KEY,
          content: WORKFLOW_REFRESH_WARNING
        })
        return
      }
      message.warning(WORKFLOW_REFRESH_WARNING)
    }
  }
}
