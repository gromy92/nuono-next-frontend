import { App, Form } from 'antd'
import { useEffect, useRef, useState } from 'react'
import {
  createOperationsSkin,
  fetchOperationsSkinDetail,
  updateOperationsSkin,
  updateOperationsSkinComponents
} from '../api'
import {
  isSystemPreviewSkin,
  type OperationsSkinGalleryRow
} from '../skinGalleryRows'
import {
  mergeOperationsSkinComponentSlots,
  normalizeOperationsSkinComponentDrafts
} from '../skinDetailSuites'
import {
  buildSaveRequest,
  decodeSkinRemark,
  errorMessage,
  normalizeSkinConfig,
  skinAssets,
  type SkinFormValues
} from '../skinPageModel'
import type { OperationsSkinComponentView, OperationsSkinView } from '../types'

export function useOperationsSkinEditor({
  storeCode,
  storeScopeKey,
  reload
}: {
  storeCode?: string
  storeScopeKey: string
  reload: () => Promise<void>
}) {
  const { message } = App.useApp()
  const [form] = Form.useForm<SkinFormValues>()
  const watchedCoverImageUrl = Form.useWatch('coverImageUrl', form)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerScopeKey, setDrawerScopeKey] = useState<string>()
  const [editingSkin, setEditingSkin] = useState<OperationsSkinGalleryRow | null>(null)
  const [componentDrafts, setComponentDrafts] = useState<OperationsSkinComponentView[]>(
    () => mergeOperationsSkinComponentSlots()
  )
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const detailRequestIdRef = useRef(0)
  const saveRequestIdRef = useRef(0)
  const latestStoreScopeKeyRef = useRef(storeScopeKey)
  latestStoreScopeKeyRef.current = storeScopeKey

  useEffect(() => {
    detailRequestIdRef.current += 1
    saveRequestIdRef.current += 1
    setDrawerOpen(false)
    setDrawerScopeKey(undefined)
    setEditingSkin(null)
    setComponentDrafts(mergeOperationsSkinComponentSlots())
    setDetailLoading(false)
    form.resetFields()
    setSaving(false)
  }, [form, storeScopeKey])

  function openCreateDrawer() {
    if (!storeCode) return
    detailRequestIdRef.current += 1
    setEditingSkin(null)
    setComponentDrafts(mergeOperationsSkinComponentSlots())
    setDetailLoading(false)
    setDrawerScopeKey(storeScopeKey)
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

  function openEditDrawer(row: OperationsSkinGalleryRow) {
    if (!storeCode) return
    const requestStoreCode = storeCode
    const requestId = detailRequestIdRef.current + 1
    detailRequestIdRef.current = requestId
    const decodedRemark = decodeSkinRemark(row.remark)
    setEditingSkin(row)
    setComponentDrafts(mergeOperationsSkinComponentSlots(row.components))
    setDrawerScopeKey(storeScopeKey)
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
        if (latestStoreScopeKeyRef.current !== storeScopeKey || detailRequestIdRef.current !== requestId) return
        const detailRemark = decodeSkinRemark(detail.remark)
        setEditingSkin({ ...detail, source: 'store', previewTone: row.previewTone })
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
        if (latestStoreScopeKeyRef.current === storeScopeKey && detailRequestIdRef.current === requestId) {
          message.error(errorMessage(error, '皮肤详情读取失败'))
        }
      })
      .finally(() => {
        if (detailRequestIdRef.current === requestId) setDetailLoading(false)
      })
  }

  function closeDrawer() {
    if (saving) return
    detailRequestIdRef.current += 1
    setDetailLoading(false)
    setDrawerOpen(false)
    setDrawerScopeKey(undefined)
  }

  async function submitDrawer() {
    if (!storeCode || drawerScopeKey !== storeScopeKey) return
    if (editingSkin && isSystemPreviewSkin(editingSkin)) {
      message.info('系统预设皮肤接入后端后可保存')
      return
    }
    const actionStoreCode = storeCode
    const actionStoreScopeKey = storeScopeKey
    const actionId = saveRequestIdRef.current + 1
    saveRequestIdRef.current = actionId
    let values: SkinFormValues
    try {
      values = await form.validateFields()
    } catch {
      return
    }
    if (latestStoreScopeKeyRef.current !== actionStoreScopeKey || saveRequestIdRef.current !== actionId) return
    const request = buildSaveRequest(actionStoreCode, values)
    setSaving(true)
    try {
      let savedSkin: OperationsSkinView
      if (editingSkin) {
        savedSkin = await updateOperationsSkin(editingSkin.id, request)
      } else {
        savedSkin = await createOperationsSkin(request)
      }
      if (latestStoreScopeKeyRef.current !== actionStoreScopeKey || saveRequestIdRef.current !== actionId) return
      await updateOperationsSkinComponents(savedSkin.id, {
        storeCode: actionStoreCode,
        components: normalizeOperationsSkinComponentDrafts(componentDrafts)
      })
      if (latestStoreScopeKeyRef.current !== actionStoreScopeKey || saveRequestIdRef.current !== actionId) return
      message.success(editingSkin ? '皮肤已保存' : '皮肤已新增')
      setDrawerOpen(false)
      setDrawerScopeKey(undefined)
      await reload()
    } catch (error) {
      if (latestStoreScopeKeyRef.current === actionStoreScopeKey && saveRequestIdRef.current === actionId) {
        message.error(errorMessage(error, '皮肤保存失败'))
      }
    } finally {
      if (saveRequestIdRef.current === actionId) setSaving(false)
    }
  }

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

  return {
    form, watchedCoverImageUrl, editingSkin, componentDrafts, setComponentDrafts,
    detailLoading, saving, editingSystemPreview, drawerSkinRow,
    visibleDrawerOpen: drawerOpen && drawerScopeKey === storeScopeKey,
    openCreateDrawer, openEditDrawer, closeDrawer, submitDrawer
  }
}
