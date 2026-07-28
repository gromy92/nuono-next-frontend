import { App } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  deleteOperationsSkin,
  fetchOperationsSkins,
  updateOperationsSkinStatus
} from '../api'
import { resolveOperationsSkinGalleryRows } from '../skinGalleryRows'
import type { StatusFilter } from '../skinPageModel'
import { errorMessage } from '../skinPageModel'
import type { OperationsSkinStatus, OperationsSkinView } from '../types'

export function useOperationsSkinList({
  storeCode,
  storeScopeKey
}: {
  storeCode?: string
  storeScopeKey: string
}) {
  const { message, modal } = App.useApp()
  const [scopedRows, setScopedRows] = useState({ scope: '', rows: [] as OperationsSkinView[] })
  const [loading, setLoading] = useState(false)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [statusUpdatingId, setStatusUpdatingId] = useState<number>()
  const [deletingId, setDeletingId] = useState<number>()
  const loadRequestIdRef = useRef(0)
  const statusActionIdRef = useRef(0)
  const deleteActionIdRef = useRef(0)
  const latestStoreScopeKeyRef = useRef(storeScopeKey)
  const latestLoadScopeRef = useRef('')
  const deleteConfirmRefs = useRef(new Set<ReturnType<typeof modal.confirm>>())
  const loadScope = `${storeScopeKey}\u0000${statusFilter}\u0000${keyword}`
  const rows = scopedRows.scope === loadScope ? scopedRows.rows : []
  latestStoreScopeKeyRef.current = storeScopeKey
  latestLoadScopeRef.current = loadScope

  useEffect(() => {
    loadRequestIdRef.current += 1
    statusActionIdRef.current += 1
    deleteActionIdRef.current += 1
    deleteConfirmRefs.current.forEach((confirm) => confirm.destroy())
    deleteConfirmRefs.current.clear()
    setScopedRows({ scope: '', rows: [] })
    setLoading(false)
    setStatusUpdatingId(undefined)
    setDeletingId(undefined)
  }, [storeScopeKey])

  const loadSkins = useCallback(async () => {
    const requestStoreCode = storeCode
    const requestStoreScopeKey = storeScopeKey
    const requestScope = `${requestStoreScopeKey}\u0000${statusFilter}\u0000${keyword}`
    const requestId = loadRequestIdRef.current + 1
    loadRequestIdRef.current = requestId
    const isCurrentRequest = () =>
      loadRequestIdRef.current === requestId
      && latestStoreScopeKeyRef.current === requestStoreScopeKey
      && latestLoadScopeRef.current === requestScope

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
      if (isCurrentRequest()) setScopedRows({ scope: requestScope, rows: nextRows })
    } catch (error) {
      if (isCurrentRequest()) {
        setScopedRows({ scope: requestScope, rows: [] })
        message.error(errorMessage(error, '皮肤列表读取失败'))
      }
    } finally {
      if (isCurrentRequest()) setLoading(false)
    }
  }, [keyword, message, statusFilter, storeCode, storeScopeKey])

  useEffect(() => {
    void loadSkins()
  }, [loadSkins])

  async function toggleStatus(row: OperationsSkinView) {
    if (!storeCode) return
    const actionStoreCode = storeCode
    const actionStoreScopeKey = storeScopeKey
    const actionId = statusActionIdRef.current + 1
    statusActionIdRef.current = actionId
    const nextStatus: OperationsSkinStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    setStatusUpdatingId(row.id)
    try {
      await updateOperationsSkinStatus(row.id, { storeCode: actionStoreCode, status: nextStatus })
      if (latestStoreScopeKeyRef.current !== actionStoreScopeKey || statusActionIdRef.current !== actionId) return
      message.success(nextStatus === 'ACTIVE' ? '皮肤已启用' : '皮肤已停用')
      await loadSkins()
    } catch (error) {
      if (latestStoreScopeKeyRef.current === actionStoreScopeKey && statusActionIdRef.current === actionId) {
        message.error(errorMessage(error, '皮肤状态更新失败'))
      }
    } finally {
      if (statusActionIdRef.current === actionId) setStatusUpdatingId(undefined)
    }
  }

  function requestDelete(row: OperationsSkinView) {
    if (!storeCode) return
    const actionStoreCode = storeCode
    const actionStoreScopeKey = storeScopeKey
    const confirm = modal.confirm({
      title: '删除皮肤',
      content: `确认删除“${row.skinName}”？删除后不能在列表中恢复。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onCancel: () => deleteConfirmRefs.current.delete(confirm),
      onOk: async () => {
        if (latestStoreScopeKeyRef.current !== actionStoreScopeKey) {
          deleteConfirmRefs.current.delete(confirm)
          return
        }
        const actionId = deleteActionIdRef.current + 1
        deleteActionIdRef.current = actionId
        setDeletingId(row.id)
        try {
          await deleteOperationsSkin(row.id, actionStoreCode)
          if (latestStoreScopeKeyRef.current !== actionStoreScopeKey || deleteActionIdRef.current !== actionId) return
          message.success('皮肤已删除')
          await loadSkins()
        } catch (error) {
          if (latestStoreScopeKeyRef.current === actionStoreScopeKey && deleteActionIdRef.current === actionId) {
            message.error(errorMessage(error, '皮肤删除失败'))
          }
        } finally {
          if (deleteActionIdRef.current === actionId) setDeletingId(undefined)
          deleteConfirmRefs.current.delete(confirm)
        }
      }
    })
    deleteConfirmRefs.current.add(confirm)
  }

  return {
    loading, keywordInput, setKeywordInput, keyword, setKeyword,
    statusFilter, setStatusFilter, statusUpdatingId, deletingId,
    loadSkins, toggleStatus, requestDelete,
    galleryRows: resolveOperationsSkinGalleryRows({
      rows, storeCode, keyword, status: statusFilter
    }),
    showInitialLoading: loading && scopedRows.scope !== loadScope
  }
}
