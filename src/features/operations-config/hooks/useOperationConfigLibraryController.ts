import { useEffect, useMemo, useState } from 'react'
import type { AuthSession } from '../../auth/session'
import {
  copyOperationConfigVersion, deleteOperationConfigVersion, fetchOperationConfigProductDimensionOptions,
  fetchOperationConfigScope, fetchOperationConfigVersionDetail, fetchOperationConfigVersions
} from '../api'
import { calendarScopeSelectOptions, filterCalendarScopePickerOptions, parseCalendarScope } from '../calendarConfigDomain'
import type { CalendarScopePickerState, OperationConfigVersionConfigType } from '../versionLibraryTypes'
import type { OperationCalendarRuleScopeQuery, OperationConfigProductDimensionOptionsView, OperationConfigScopeView, OperationConfigVersionDetail, OperationConfigVersionRow } from '../types'

export function useOperationConfigLibraryController({ session, configType }: {
  session: AuthSession
  configType?: OperationConfigVersionConfigType
}) {
  const [versions, setVersions] = useState<OperationConfigVersionRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [detail, setDetail] = useState<OperationConfigVersionDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [copyingVersionNo, setCopyingVersionNo] = useState<string>()
  const [calendarEditor, setCalendarEditor] = useState<OperationConfigVersionDetail | null>(null)
  const [lifecycleEditor, setLifecycleEditor] = useState<OperationConfigVersionDetail | null>(null)
  const [editorLoading, setEditorLoading] = useState(false)
  const [editorSaving, setEditorSaving] = useState(false)
  const [deletingVersionNo, setDeletingVersionNo] = useState<string>()
  const [publishCandidate, setPublishCandidate] = useState<OperationConfigVersionRow | null>(null)
  const [publishingVersionNo, setPublishingVersionNo] = useState<string>()
  const [disablingVersionNo, setDisablingVersionNo] = useState<string>()
  const [scope, setScope] = useState<OperationConfigScopeView | null>(null)
  const [calendarDimensionOptions, setCalendarDimensionOptions] = useState<{
    loading: boolean
    view?: OperationConfigProductDimensionOptionsView
    error?: string
  }>({ loading: false })
  const [calendarScopePicker, setCalendarScopePicker] = useState<CalendarScopePickerState | null>(null)

  const filterVersions = (rows: OperationConfigVersionRow[]) =>
    configType ? rows.filter((row) => row.configType === configType) : rows

  const shouldKeepVersion = (row: OperationConfigVersionRow) => !configType || row.configType === configType

  const calendarScopePickerOptions = useMemo(() => {
    if (!calendarScopePicker) {
      return []
    }
    return filterCalendarScopePickerOptions(
      calendarScopeSelectOptions(calendarScopePicker.type, calendarDimensionOptions.view),
      calendarScopePicker.query
    )
  }, [calendarDimensionOptions.view, calendarScopePicker])

  const calendarScopePickerSelectedValue = calendarScopePicker && calendarEditor
    ? parseCalendarScope(calendarEditor.items[calendarScopePicker.index]?.resultShape).value
    : null

  const productDimensionScope = useMemo<OperationCalendarRuleScopeQuery | null>(() => {
    const fallbackStore = scope?.stores?.[0]
    const ownerUserId = scope?.defaultOwnerUserId ?? fallbackStore?.ownerUserId
    const storeCode = scope?.defaultStoreCode ?? fallbackStore?.storeCode
    const siteCode = scope?.defaultSiteCode ?? fallbackStore?.siteCode
    if ((!ownerUserId || !storeCode || !siteCode) && scope?.systemAdmin) {
      const fallbackBossUserId = scope.selectedBossUserIds?.[0] ?? scope.bossOptions?.[0]?.ownerUserId
      return fallbackBossUserId
        ? {
            bossUserIds: [fallbackBossUserId],
            ownerUserId: fallbackBossUserId,
            storeCode: '*',
            siteCode: '*'
          }
        : null
    }
    if (!ownerUserId || !storeCode || !siteCode) {
      return null
    }
    return {
      bossUserIds: scope?.selectedBossUserIds ?? [],
      ownerUserId,
      storeCode,
      siteCode
    }
  }, [scope])

  const loadVersions = async () => {
    setLoading(true)
    setError(undefined)
    try {
      setVersions(filterVersions(await fetchOperationConfigVersions()))
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '运营配置版本读取失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadVersions()
  }, [session.accountNo, session.roleName, configType])

  useEffect(() => {
    let cancelled = false
    const loadScope = async () => {
      try {
        const nextScope = await fetchOperationConfigScope()
        if (!cancelled) {
          setScope(nextScope)
        }
      } catch {
        if (!cancelled) {
          setScope(null)
        }
      }
    }
    void loadScope()
    return () => {
      cancelled = true
    }
  }, [session.accountNo, session.roleName])

  useEffect(() => {
    if (!calendarEditor) {
      setCalendarDimensionOptions((current) => ({ loading: false, view: current.view }))
      return
    }
    if (!productDimensionScope) {
      setCalendarDimensionOptions({ loading: false, error: '缺少可用店铺范围，暂时不能读取类目候选' })
      return
    }
    let cancelled = false
    setCalendarDimensionOptions((current) => ({ loading: true, view: current.view }))
    fetchOperationConfigProductDimensionOptions({ ...productDimensionScope, limit: 80 })
      .then((view) => {
        if (!cancelled) {
          setCalendarDimensionOptions({ loading: false, view })
        }
      })
      .catch((exception) => {
        if (!cancelled) {
          setCalendarDimensionOptions({
            loading: false,
            error: exception instanceof Error ? exception.message : '类目候选读取失败'
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [calendarEditor?.versionNo, productDimensionScope])

  const openDetail = async (record: OperationConfigVersionRow) => {
    setDetailLoading(true)
    setError(undefined)
    try {
      setDetail(await fetchOperationConfigVersionDetail(record.versionNo))
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '运营配置版本详情读取失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const copyVersion = async (record: OperationConfigVersionRow) => {
    setCopyingVersionNo(record.versionNo)
    setError(undefined)
    try {
      const draft = await copyOperationConfigVersion(record.versionNo)
      setVersions((current) =>
        shouldKeepVersion(draft) ? [draft, ...current.filter((item) => item.versionNo !== draft.versionNo)] : current
      )
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '运营配置版本复制失败')
    } finally {
      setCopyingVersionNo(undefined)
    }
  }

  const deleteVersion = async (record: OperationConfigVersionRow) => {
    setDeletingVersionNo(record.versionNo)
    setError(undefined)
    try {
      await deleteOperationConfigVersion(record.versionNo)
      setVersions((current) => current.filter((item) => item.versionNo !== record.versionNo))
      setDetail((current) => (current?.versionNo === record.versionNo ? null : current))
      setCalendarEditor((current) => (current?.versionNo === record.versionNo ? null : current))
      setLifecycleEditor((current) => (current?.versionNo === record.versionNo ? null : current))
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '运营配置版本删除失败')
    } finally {
      setDeletingVersionNo(undefined)
    }
  }

  const closeCalendarVersionEditor = () => {
    setCalendarScopePicker(null)
    setCalendarEditor(null)
  }

  const openEditor = async (record: OperationConfigVersionRow) => {
    if (record.configType !== 'BUSINESS_CALENDAR' && record.configType !== 'PRODUCT_LIFECYCLE') {
      setError('当前版本类型暂不支持编辑')
      return
    }
    setEditorLoading(true)
    setError(undefined)
    try {
      const versionDetail = await fetchOperationConfigVersionDetail(record.versionNo)
      if (versionDetail.configType === 'BUSINESS_CALENDAR') {
        setLifecycleEditor(null)
        setCalendarEditor(versionDetail)
      } else {
        setCalendarEditor(null)
        setLifecycleEditor(versionDetail)
      }
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '运营配置版本详情读取失败')
    } finally {
      setEditorLoading(false)
    }
  }

  return {
    versions, setVersions, loading, error, setError, detail, setDetail, detailLoading,
    copyingVersionNo, deletingVersionNo, calendarEditor, setCalendarEditor,
    lifecycleEditor, setLifecycleEditor, editorLoading, editorSaving, setEditorSaving,
    publishCandidate, setPublishCandidate, publishingVersionNo, setPublishingVersionNo,
    disablingVersionNo, setDisablingVersionNo, scope, calendarDimensionOptions,
    calendarScopePicker, setCalendarScopePicker, calendarScopePickerOptions,
    calendarScopePickerSelectedValue, shouldKeepVersion, loadVersions, openDetail, copyVersion,
    deleteVersion, closeCalendarVersionEditor, openEditor
  }
}
