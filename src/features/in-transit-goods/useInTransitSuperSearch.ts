import { useState } from 'react'
import { message } from 'antd'
import { fetchInTransitSuperSearch } from './api'
import type { InTransitSuperSearchResult } from './types'

type SuperSearchState =
  | { status: 'idle' | 'loading'; result?: InTransitSuperSearchResult; message?: string }
  | { status: 'success'; result: InTransitSuperSearchResult; message?: string }
  | { status: 'error'; result?: InTransitSuperSearchResult; message: string }

export function useInTransitSuperSearch() {
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [includeHistory, setIncludeHistory] = useState(false)
  const [projectCode, setProjectCode] = useState<string | undefined>()
  const [state, setState] = useState<SuperSearchState>({ status: 'idle' })

  const openPanel = () => {
    setOpen(true)
  }

  const closePanel = () => {
    setOpen(false)
  }

  const search = async (
    nextKeyword = keyword,
    nextIncludeHistory = includeHistory,
    nextProjectCode = projectCode
  ) => {
    const resolvedKeyword = nextKeyword.trim()
    setKeyword(nextKeyword)
    if (!resolvedKeyword) {
      message.warning('请输入 PSKU、中文标题或英文标题')
      setState({ status: 'idle' })
      return
    }
    setState((current) => ({ status: 'loading', result: current.result }))
    try {
      const result = await fetchInTransitSuperSearch({
        keyword: resolvedKeyword,
        includeHistory: nextIncludeHistory,
        projectCode: nextProjectCode,
        limit: 30
      })
      setState({ status: 'success', result })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '超级搜索失败'
      setState({ status: 'error', message: errorMessage })
      message.error(errorMessage)
    }
  }

  return {
    open,
    keyword,
    includeHistory,
    projectCode,
    state,
    setKeyword,
    setIncludeHistory,
    setProjectCode,
    openPanel,
    closePanel,
    search
  }
}
