import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, DatePicker, Drawer, Input, InputNumber, Modal, Select, Space, Table, Tag, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import type { AuthSession } from '../auth/session'
import {
  copyOperationConfigVersion,
  deleteOperationConfigVersion,
  disableOperationConfigVersion,
  fetchOperationConfigScope,
  fetchOperationConfigProductDimensionOptions,
  fetchOperationConfigVersionDetail,
  fetchOperationConfigVersions,
  publishOperationConfigVersion,
  updateOperationConfigVersion
} from './api'
import type {
  OperationCalendarRuleScopeQuery,
  OperationConfigDefaultVersionItem,
  OperationConfigProductDimensionOption,
  OperationConfigProductDimensionOptionsView,
  OperationConfigScopeView,
  OperationConfigVersionRow,
  OperationConfigVersionDetail
} from './types'
import './OperationsConfigPage.css'

const { Text, Title } = Typography

type OperationConfigVersionConfigType = 'BUSINESS_CALENDAR' | 'PRODUCT_LIFECYCLE'

type OperationConfigVersionLibraryPageProps = {
  session: AuthSession
  configType?: OperationConfigVersionConfigType
  title?: string
}

type CalendarItemPreset = {
  groupName: string
  itemName: string
  valueType: string | null
  resultShape: string | null
}

type CalendarScopeType = 'all_products' | 'brand' | 'product_fulltype' | 'category'

type CalendarScopePickerState = {
  index: number
  type: CalendarScopeType
  query: string
}

type CalendarScopePickerOption = {
  value: string
  label: string
  title: string
}

const CALENDAR_SCOPE_OPTIONS: Array<{ value: CalendarScopeType; label: string; requiresValue: boolean }> = [
  { value: 'all_products', label: '全品', requiresValue: false },
  { value: 'brand', label: '品牌', requiresValue: true },
  { value: 'product_fulltype', label: 'Product Fulltype', requiresValue: true },
  { value: 'category', label: '类目', requiresValue: true }
]

const CALENDAR_ITEM_PRESETS: CalendarItemPreset[] = [
  { groupName: '业务日历', itemName: '斋月 (Ramadan)', valueType: '日期范围', resultShape: null },
  { groupName: '业务日历', itemName: '开斋节 (Eid al-Fitr)', valueType: '日期范围', resultShape: null },
  { groupName: '业务日历', itemName: '古尔邦节 (Eid al-Adha)', valueType: '日期范围', resultShape: null },
  { groupName: '业务日历', itemName: '白色星期五', valueType: '日期范围', resultShape: null },
  { groupName: '业务日历', itemName: '黄色星期五', valueType: '日期范围', resultShape: null },
  { groupName: '业务日历', itemName: '双十一 (11.11)', valueType: '日期范围', resultShape: null },
  { groupName: '业务日历', itemName: '开学季模式', valueType: '日期范围', resultShape: null },
  { groupName: '业务日历', itemName: '夏季模式', valueType: '日期范围', resultShape: null }
]

function statusTag(record: OperationConfigVersionRow) {
  if (record.status === 'SYSTEM_DEFAULT') {
    return <Tag color="blue">{record.statusLabel || '系统默认'}</Tag>
  }
  if (record.status === 'DRAFT') {
    return <Tag color="gold">{record.statusLabel || '草稿'}</Tag>
  }
  if (record.status === 'PUBLISHED' || record.status === 'CURRENT') {
    return <Tag color="green">{record.statusLabel || '当前生效'}</Tag>
  }
  if (record.status === 'HISTORICAL') {
    return <Tag>{record.statusLabel || '历史'}</Tag>
  }
  if (record.status === 'DISABLED') {
    return <Tag color="red">{record.statusLabel || '已停用'}</Tag>
  }
  return <Tag>{record.statusLabel || record.status}</Tag>
}

function configTypeTag(record: OperationConfigVersionRow) {
  const color = record.configType === 'PRODUCT_LIFECYCLE' ? 'purple' : 'cyan'
  return <Tag color={color}>{record.configTypeLabel}</Tag>
}

function findAction(record: OperationConfigVersionRow, action: string) {
  return record.actions.find((item) => item.action === action)
}

function actionButton(
  record: OperationConfigVersionRow,
  action: string,
  fallbackLabel: string,
  onAction?: (record: OperationConfigVersionRow) => void
) {
  const item = findAction(record, action) ?? {
    action,
    label: fallbackLabel,
    enabled: false,
    disabledReason: '当前版本状态不可执行'
  }
  const button = (
    <Button
      data-testid={`operation-config-version-action-${action.toLowerCase()}-${record.versionNo}`}
      size="small"
      type={action === 'PUBLISH' ? 'primary' : action === 'DETAIL' ? 'link' : undefined}
      danger={action === 'DISABLE'}
      disabled={!item.enabled}
      onClick={() => {
        if (item.enabled) {
          onAction?.(record)
        }
      }}
    >
      {item.label}
    </Button>
  )
  if (item.enabled || !item.disabledReason) {
    return button
  }
  return <Tooltip title={item.disabledReason}>{button}</Tooltip>
}

function itemMeta(item: OperationConfigDefaultVersionItem) {
  return [item.valueType, item.defaultValue, calendarScopeText(item.resultShape)].filter(Boolean).join(' / ')
}

function detailToRow(detail: OperationConfigVersionDetail): OperationConfigVersionRow {
  const { items: _items, ...row } = detail
  return row
}

function calendarPresetFor(itemName?: string | null) {
  return CALENDAR_ITEM_PRESETS.find((preset) => preset.itemName === itemName)
}

function isCalendarDateRangeItem(item: OperationConfigDefaultVersionItem) {
  const preset = calendarPresetFor(item.itemName)
  return (preset?.valueType ?? item.valueType) === '日期范围'
}

function parseDateRangeValue(value?: string | null): [Dayjs, Dayjs] | undefined {
  if (!value) {
    return undefined
  }
  const match = value.match(/(\d{4}-\d{2}-\d{2}).*?(\d{4}-\d{2}-\d{2})/)
  if (!match) {
    return undefined
  }
  const start = dayjs(match[1])
  const end = dayjs(match[2])
  return start.isValid() && end.isValid() ? [start, end] : undefined
}

function formatDateRangeValue(dates: [Dayjs | null, Dayjs | null] | null) {
  if (!dates?.[0] || !dates[1]) {
    return null
  }
  return `${dates[0].format('YYYY-MM-DD')} ~ ${dates[1].format('YYYY-MM-DD')}`
}

function calendarDateRangeText(value?: string | null) {
  const dateRange = parseDateRangeValue(value)
  return dateRange ? formatDateRangeValue(dateRange) : null
}

function calendarFactorValue(value?: string | null) {
  if (!value) {
    return null
  }
  const withoutDateRange = value.replace(/\d{4}-\d{2}-\d{2}.*?\d{4}-\d{2}-\d{2}/, '')
  const matches = withoutDateRange.match(/-?\d+(?:\.\d+)?/g)
  return matches?.[matches.length - 1] ?? null
}

function composeCalendarDefaultValue(
  dateRange: string | null | undefined,
  factor: string | number | null | undefined
) {
  const normalizedDateRange = dateRange?.trim() || null
  const normalizedFactor = factor === null || factor === undefined ? null : String(factor).trim() || null
  if (normalizedDateRange && normalizedFactor) {
    return `${normalizedDateRange} / ${normalizedFactor}`
  }
  return normalizedDateRange ?? normalizedFactor
}

function parseCalendarScope(resultShape?: string | null): { type: CalendarScopeType; value: string | null } {
  const raw = resultShape?.trim()
  if (!raw) {
    return { type: 'all_products', value: null }
  }
  const separator = raw.indexOf(':')
  const rawType = separator > 0 ? raw.slice(0, separator).trim().toLowerCase() : raw.toLowerCase()
  const rawValue = separator > 0 ? raw.slice(separator + 1).trim() : null
  if (rawType === 'brand') {
    return { type: 'brand', value: rawValue || null }
  }
  if (rawType === 'product_fulltype' || rawType === 'fulltype') {
    return { type: 'product_fulltype', value: rawValue || null }
  }
  if (rawType === 'category') {
    return { type: 'category', value: rawValue || null }
  }
  return { type: 'all_products', value: null }
}

function formatCalendarScope(type: CalendarScopeType, value?: string | null) {
  if (type === 'all_products') {
    return 'all_products'
  }
  const normalizedValue = value?.trim()
  return normalizedValue ? `${type}:${normalizedValue}` : type
}

function calendarScopeLabel(type: CalendarScopeType) {
  return CALENDAR_SCOPE_OPTIONS.find((option) => option.value === type)?.label ?? '全品'
}

function calendarScopeRequiresValue(type: CalendarScopeType) {
  return Boolean(CALENDAR_SCOPE_OPTIONS.find((option) => option.value === type)?.requiresValue)
}

function productDimensionSelectOptions(options?: OperationConfigProductDimensionOption[]): CalendarScopePickerOption[] {
  return (options ?? []).map((option) => ({
    value: option.value,
    label: option.label || option.value,
    title: option.label || option.value
  }))
}

function calendarScopeSelectOptions(
  type: CalendarScopeType,
  view?: OperationConfigProductDimensionOptionsView
) {
  if (type === 'brand') {
    return productDimensionSelectOptions(view?.brands)
  }
  if (type === 'product_fulltype') {
    return productDimensionSelectOptions(view?.productFulltypes)
  }
  if (type === 'category') {
    return productDimensionSelectOptions(view?.categories)
  }
  return []
}

function calendarScopeUsesDimensionOptions(type: CalendarScopeType) {
  return type === 'brand' || type === 'product_fulltype' || type === 'category'
}

function filterCalendarScopePickerOptions(options: CalendarScopePickerOption[], query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return options
  }
  return options.filter((option) => `${option.label} ${option.value}`.toLowerCase().includes(normalizedQuery))
}

function calendarScopeText(resultShape?: string | null) {
  const scope = parseCalendarScope(resultShape)
  if (scope.type === 'all_products') {
    return '范围：全品'
  }
  return scope.value ? `${calendarScopeLabel(scope.type)}：${scope.value}` : `${calendarScopeLabel(scope.type)}：未设置`
}

function lifecycleItemDisplayName(item: OperationConfigDefaultVersionItem) {
  const itemName = item.itemName || '生命周期阈值'
  return item.valueType ? `${itemName}(${item.valueType})` : itemName
}

function lifecycleStageTagColor(groupName?: string | null) {
  if (groupName === '新品期') {
    return 'blue'
  }
  if (groupName === '成长期') {
    return 'green'
  }
  if (groupName === '稳定期') {
    return 'cyan'
  }
  if (groupName === '衰退期') {
    return 'orange'
  }
  if (groupName === '长尾期') {
    return 'purple'
  }
  return 'default'
}

function normalizeCalendarItem(item: OperationConfigDefaultVersionItem): OperationConfigDefaultVersionItem {
  const preset = calendarPresetFor(item.itemName)
  const scope = parseCalendarScope(item.resultShape)
  return {
    ...item,
    groupName: preset?.groupName ?? item.groupName ?? '业务日历',
    cadence: null,
    valueType: preset?.valueType ?? item.valueType ?? null,
    defaultValue: item.defaultValue || null,
    resultShape: preset?.resultShape ?? formatCalendarScope(scope.type, scope.value),
    note: item.note ?? null
  }
}

export function OperationConfigVersionLibraryPage({
  session,
  configType,
  title = '运营配置版本'
}: OperationConfigVersionLibraryPageProps) {
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

  const updateCalendarItem = (
    index: number,
    patch: Partial<OperationConfigDefaultVersionItem>
  ) => {
    setCalendarEditor((current) => {
      if (!current) {
        return current
      }
      return {
        ...current,
        items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
      }
    })
  }

  const updateCalendarEditorMeta = (
    patch: Partial<Pick<OperationConfigVersionDetail, 'displayName' | 'summary'>>
  ) => {
    setCalendarEditor((current) => (current ? { ...current, ...patch } : current))
  }

  const addCalendarItem = () => {
    setCalendarEditor((current) => {
      if (!current) {
        return current
      }
      const preset = CALENDAR_ITEM_PRESETS[0]
      return {
        ...current,
        items: [
          ...current.items,
          {
            groupName: preset.groupName,
            itemName: preset.itemName,
            cadence: null,
            valueType: preset.valueType,
            defaultValue: null,
            resultShape: preset.resultShape ?? 'all_products',
            note: null
          }
        ]
      }
    })
  }

  const removeCalendarItem = (index: number) => {
    setCalendarEditor((current) => {
      if (!current || current.items.length <= 1) {
        return current
      }
      return {
        ...current,
        items: current.items.filter((_, itemIndex) => itemIndex !== index)
      }
    })
  }

  const saveCalendarEditor = async () => {
    if (!calendarEditor) {
      return
    }
    setEditorSaving(true)
    setError(undefined)
    try {
      const updated = await updateOperationConfigVersion(calendarEditor.versionNo, {
        configType: 'BUSINESS_CALENDAR',
        displayName: calendarEditor.displayName,
        summary: calendarEditor.summary,
        items: calendarEditor.items.map(normalizeCalendarItem)
      })
      const updatedRow = detailToRow(updated)
      setVersions((current) => current.map((item) => (item.versionNo === updated.versionNo ? updatedRow : item)).filter(shouldKeepVersion))
      setDetail((current) => (current?.versionNo === updated.versionNo ? updated : current))
      closeCalendarVersionEditor()
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '运营配置版本保存失败')
    } finally {
      setEditorSaving(false)
    }
  }

  const updateLifecycleItem = (
    index: number,
    patch: Partial<OperationConfigDefaultVersionItem>
  ) => {
    setLifecycleEditor((current) => {
      if (!current) {
        return current
      }
      return {
        ...current,
        items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
      }
    })
  }

  const updateLifecycleEditorMeta = (
    patch: Partial<Pick<OperationConfigVersionDetail, 'displayName' | 'summary'>>
  ) => {
    setLifecycleEditor((current) => (current ? { ...current, ...patch } : current))
  }

  const saveLifecycleEditor = async () => {
    if (!lifecycleEditor) {
      return
    }
    setEditorSaving(true)
    setError(undefined)
    try {
      const updated = await updateOperationConfigVersion(lifecycleEditor.versionNo, {
        configType: 'PRODUCT_LIFECYCLE',
        displayName: lifecycleEditor.displayName,
        summary: lifecycleEditor.summary,
        items: lifecycleEditor.items.map((item) => ({
          ...item,
          cadence: null
        }))
      })
      const updatedRow = detailToRow(updated)
      setVersions((current) => current.map((item) => (item.versionNo === updated.versionNo ? updatedRow : item)).filter(shouldKeepVersion))
      setDetail((current) => (current?.versionNo === updated.versionNo ? updated : current))
      setLifecycleEditor(null)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '运营配置版本保存失败')
    } finally {
      setEditorSaving(false)
    }
  }

  const publishScopePayload = () => {
    if (scope?.systemAdmin) {
      return {}
    }
    const fallbackStore = scope?.stores?.[0]
    const ownerUserId = scope?.defaultOwnerUserId ?? fallbackStore?.ownerUserId
    const storeCode = scope?.defaultStoreCode ?? fallbackStore?.storeCode
    const siteCode = scope?.defaultSiteCode ?? fallbackStore?.siteCode
    if (!ownerUserId || !storeCode || !siteCode) {
      return null
    }
    return { ownerUserId, storeCode, siteCode }
  }

  const confirmPublish = async () => {
    if (!publishCandidate) {
      return
    }
    const scopePayload = publishScopePayload()
    if (scopePayload === null) {
      setError('缺少可发布的授权店铺范围')
      return
    }
    setPublishingVersionNo(publishCandidate.versionNo)
    setError(undefined)
    try {
      const published = await publishOperationConfigVersion(publishCandidate.versionNo, {
        ...scopePayload,
        message: 'publish typed operation config version'
      })
      const publishedRow = detailToRow(published)
      setVersions((current) => current.map((item) => (item.versionNo === published.versionNo ? publishedRow : item)).filter(shouldKeepVersion))
      setDetail((current) => (current?.versionNo === published.versionNo ? published : current))
      setPublishCandidate(null)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '运营配置版本发布失败')
    } finally {
      setPublishingVersionNo(undefined)
    }
  }

  const disableVersion = async (record: OperationConfigVersionRow) => {
    setDisablingVersionNo(record.versionNo)
    setError(undefined)
    try {
      const disabled = await disableOperationConfigVersion(record.versionNo, { reason: '停用版本' })
      const disabledRow = detailToRow(disabled)
      setVersions((current) => current.map((item) => (item.versionNo === disabled.versionNo ? disabledRow : item)).filter(shouldKeepVersion))
      setDetail((current) => (current?.versionNo === disabled.versionNo ? disabled : current))
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : '运营配置版本停用失败')
    } finally {
      setDisablingVersionNo(undefined)
    }
  }

  const columns = useMemo<ColumnsType<OperationConfigVersionRow>>(() => {
    const nextColumns: ColumnsType<OperationConfigVersionRow> = [
      {
        title: '版本',
        dataIndex: 'displayName',
        key: 'displayName',
        width: 250,
        render: (_: unknown, record) => (
          <Space direction="vertical" size={2}>
            <Text strong>{record.displayName}</Text>
          </Space>
        )
      }
    ]
    if (!configType) {
      nextColumns.push({
        title: '配置类型',
        dataIndex: 'configTypeLabel',
        key: 'configTypeLabel',
        width: 140,
        render: (_: unknown, record) => configTypeTag(record)
      })
    }
    nextColumns.push(
      {
        title: '状态',
        dataIndex: 'statusLabel',
        key: 'statusLabel',
        width: 130,
        render: (_: unknown, record) => statusTag(record)
      },
      {
        title: '摘要',
        dataIndex: 'summary',
        key: 'summary',
        width: 220,
        render: (value: string | null | undefined, record) => value || `${record.itemCount} 项`
      },
      {
        title: '范围',
        dataIndex: 'scopeSummary',
        key: 'scopeSummary',
        width: 160,
        render: (value?: string | null) => value || '未设置'
      },
      {
        title: '操作',
        key: 'actions',
        width: 520,
        render: (_: unknown, record) => (
          <Space size={4}>
            {actionButton(record, 'EDIT', '编辑', openEditor)}
            {actionButton(record, 'DETAIL', '查看详情', openDetail)}
            {actionButton(record, 'COPY', copyingVersionNo === record.versionNo ? '复制中' : '复制版本', copyVersion)}
            {actionButton(record, 'DELETE', deletingVersionNo === record.versionNo ? '删除中' : '删除', deleteVersion)}
            {actionButton(record, 'PUBLISH', publishingVersionNo === record.versionNo ? '发布中' : '发布', setPublishCandidate)}
            {actionButton(record, 'DISABLE', disablingVersionNo === record.versionNo ? '停用中' : '停用', disableVersion)}
          </Space>
        )
      }
    )
    return nextColumns
  }, [configType, copyingVersionNo, deletingVersionNo, publishingVersionNo, disablingVersionNo])

  return (
    <section className="operations-config-suite-page operations-config-version-library-page">
      <Space direction="vertical" size={16} className="operations-config-suite-layout">
        {!configType ? (
          <Space direction="vertical" size={4}>
            <Title level={3} data-testid="operation-config-version-library-title">
              {title}
            </Title>
          </Space>
        ) : null}
        {error ? <Alert type="error" showIcon message={error} /> : null}
        <Table
          data-testid="operation-config-version-library-table"
          rowKey="versionNo"
          columns={columns}
          dataSource={versions}
          loading={loading}
          pagination={false}
          scroll={{ x: configType ? 1160 : 1300 }}
        />
        <Drawer
          title={detail?.displayName || '版本详情'}
          open={Boolean(detail)}
          onClose={() => setDetail(null)}
          width={720}
          loading={detailLoading}
        >
          {detail ? (
            <Space direction="vertical" size={16} className="operations-config-suite-layout" data-testid="operation-config-version-detail">
              <Space direction="vertical" size={4}>
                <Text strong>{detail.displayName}</Text>
                <Space>
                  {configTypeTag(detail)}
                  {statusTag(detail)}
                  {detail.sourceLabel && detail.sourceLabel !== detail.statusLabel ? <Tag>{detail.sourceLabel}</Tag> : null}
                </Space>
                <Text type="secondary">{detail.summary}</Text>
              </Space>
              <Table
                size="small"
                rowKey={(item) => `${item.groupName || 'default'}-${item.itemName}`}
                pagination={false}
                dataSource={detail.items}
                columns={[
                  {
                    title: '分组',
                    dataIndex: 'groupName',
                    key: 'groupName',
                    width: 120,
                    render: (value?: string | null) => value || '默认'
                  },
                  {
                    title: '配置项',
                    dataIndex: 'itemName',
                    key: 'itemName',
                    width: 180
                  },
                  {
                    title: '默认信息',
                    key: 'meta',
                    render: (_: unknown, item) => itemMeta(item) || item.note || '默认'
                  }
                ]}
              />
            </Space>
          ) : null}
        </Drawer>
        <Drawer
          title={calendarEditor?.displayName || '日历配置'}
          open={Boolean(calendarEditor)}
          onClose={closeCalendarVersionEditor}
          width={1040}
          loading={editorLoading}
        >
          {calendarEditor ? (
            <Space direction="vertical" size={16} className="operations-config-suite-layout" data-testid="operation-config-calendar-editor">
              <div className="operation-config-calendar-version-editor-header" data-testid="operation-config-calendar-editor-header">
                <div className="operation-config-version-editor-header-main">
                  <Space>
                    {configTypeTag(calendarEditor)}
                    {statusTag(calendarEditor)}
                  </Space>
                  <div className="operation-config-version-editor-meta">
                    <Input
                      data-testid="operation-config-calendar-display-name"
                      value={calendarEditor.displayName || ''}
                      placeholder="版本名称"
                      onChange={(event) => updateCalendarEditorMeta({ displayName: event.target.value })}
                    />
                    <Input
                      data-testid="operation-config-calendar-summary"
                      value={calendarEditor.summary || ''}
                      placeholder="摘要"
                      onChange={(event) => updateCalendarEditorMeta({ summary: event.target.value })}
                    />
                  </div>
                </div>
                <Button data-testid="operation-config-calendar-add" onClick={addCalendarItem}>
                  增加日历项
                </Button>
              </div>
              <Space direction="vertical" size={12}>
                {calendarEditor.items.map((item, index) => (
                  <div className="operation-config-calendar-version-editor-row" key={`${item.groupName || 'row'}-${index}`}>
                    <Input
                      data-testid={`operation-config-calendar-item-name-${index}`}
                      value={item.itemName || ''}
                      placeholder="节日"
                      onChange={(event) => {
                        const nextItemName = event.target.value
                        const preset = calendarPresetFor(nextItemName)
                        updateCalendarItem(index, {
                          itemName: nextItemName,
                          groupName: preset?.groupName ?? '业务日历',
                          cadence: null,
                          valueType: preset?.valueType ?? '日期范围',
                          defaultValue: composeCalendarDefaultValue(calendarDateRangeText(item.defaultValue), calendarFactorValue(item.defaultValue)),
                          resultShape: preset?.resultShape ?? item.resultShape ?? 'all_products'
                        })
                      }}
                    />
                    {isCalendarDateRangeItem(item) ? (
                      <>
                        <div data-testid={`operation-config-calendar-item-date-range-${index}`}>
                          <DatePicker.RangePicker
                            className="operation-config-calendar-date-range"
                            placeholder={['开始日期', '结束日期']}
                            value={parseDateRangeValue(item.defaultValue)}
                            onChange={(dates) =>
                              updateCalendarItem(index, {
                                defaultValue: composeCalendarDefaultValue(formatDateRangeValue(dates), calendarFactorValue(item.defaultValue))
                              })
                            }
                          />
                        </div>
                        <div data-testid={`operation-config-calendar-item-factor-${index}`}>
                          <InputNumber<string>
                            className="operation-config-calendar-factor-input"
                            min="0"
                            step="0.01"
                            stringMode
                            value={calendarFactorValue(item.defaultValue) ?? undefined}
                            placeholder="爆发系数"
                            onChange={(value) =>
                              updateCalendarItem(index, {
                                defaultValue: composeCalendarDefaultValue(calendarDateRangeText(item.defaultValue), value)
                              })
                            }
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <Input
                          data-testid={`operation-config-calendar-item-default-value-${index}`}
                          value={item.defaultValue || ''}
                          placeholder="默认值"
                          onChange={(event) => updateCalendarItem(index, { defaultValue: event.target.value })}
                        />
                        <Input
                          data-testid={`operation-config-calendar-item-result-shape-${index}`}
                          value={item.resultShape || ''}
                          placeholder="结果形态"
                          onChange={(event) => updateCalendarItem(index, { resultShape: event.target.value })}
                        />
                      </>
                    )}
                    <Select<CalendarScopeType>
                      data-testid={`operation-config-calendar-item-scope-type-${index}`}
                      value={parseCalendarScope(item.resultShape).type}
                      options={CALENDAR_SCOPE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                      onChange={(scopeType) => {
                        const currentScope = parseCalendarScope(item.resultShape)
                        updateCalendarItem(index, {
                          resultShape: formatCalendarScope(scopeType, scopeType === currentScope.type ? currentScope.value : null)
                        })
                      }}
                    />
                    {calendarScopeRequiresValue(parseCalendarScope(item.resultShape).type) ? (
                      calendarScopeUsesDimensionOptions(parseCalendarScope(item.resultShape).type) ? (
                        <Button
                          data-testid={`operation-config-calendar-item-scope-value-${index}`}
                          className="operation-config-calendar-scope-picker-trigger"
                          loading={calendarDimensionOptions.loading}
                          onClick={() =>
                            setCalendarScopePicker({
                              index,
                              type: parseCalendarScope(item.resultShape).type,
                              query: ''
                            })
                          }
                        >
                          <span>{parseCalendarScope(item.resultShape).value || `选择${calendarScopeLabel(parseCalendarScope(item.resultShape).type)}`}</span>
                        </Button>
                      ) : (
                        <Input
                          data-testid={`operation-config-calendar-item-scope-value-${index}`}
                          value={parseCalendarScope(item.resultShape).value || ''}
                          placeholder={`${calendarScopeLabel(parseCalendarScope(item.resultShape).type)}值`}
                          onChange={(event) =>
                            updateCalendarItem(index, {
                              resultShape: formatCalendarScope(parseCalendarScope(item.resultShape).type, event.target.value)
                            })
                          }
                        />
                      )
                    ) : null}
                    <Button
                      danger
                      data-testid={`operation-config-calendar-item-delete-${index}`}
                      disabled={calendarEditor.items.length <= 1}
                      onClick={() => removeCalendarItem(index)}
                    >
                      删除
                    </Button>
                  </div>
                ))}
              </Space>
              <Space>
                <Button onClick={closeCalendarVersionEditor} disabled={editorSaving}>
                  取消
                </Button>
                <Button type="primary" data-testid="operation-config-calendar-save" loading={editorSaving} onClick={saveCalendarEditor}>
                  保存
                </Button>
              </Space>
            </Space>
          ) : null}
        </Drawer>
        <Modal
          title={calendarScopePicker ? `选择${calendarScopeLabel(calendarScopePicker.type)}` : '选择范围'}
          open={Boolean(calendarScopePicker)}
          onCancel={() => setCalendarScopePicker(null)}
          footer={null}
          width={720}
          destroyOnClose
        >
          {calendarScopePicker ? (
            <Space direction="vertical" size={12} className="operation-config-calendar-scope-picker" data-testid="operation-config-calendar-scope-picker-modal">
              <Input
                data-testid="operation-config-calendar-scope-picker-search"
                allowClear
                placeholder={`搜索${calendarScopeLabel(calendarScopePicker.type)}`}
                value={calendarScopePicker.query}
                onChange={(event) =>
                  setCalendarScopePicker((current) => current ? { ...current, query: event.target.value } : current)
                }
              />
              <div className="operation-config-calendar-scope-picker-list">
                {calendarScopePickerOptions.length ? (
                  calendarScopePickerOptions.map((option) => (
                    <Button
                      key={option.value}
                      type={option.value === calendarScopePickerSelectedValue ? 'primary' : 'text'}
                      data-testid={`operation-config-calendar-scope-picker-option-${option.value}`}
                      className="operation-config-calendar-scope-picker-option"
                      onClick={() => {
                        updateCalendarItem(calendarScopePicker.index, {
                          resultShape: formatCalendarScope(calendarScopePicker.type, option.value)
                        })
                        setCalendarScopePicker(null)
                      }}
                    >
                      <span>{option.label}</span>
                    </Button>
                  ))
                ) : (
                  <div className="operation-config-calendar-scope-picker-empty">
                    <Text type="secondary">没有可选择的{calendarScopeLabel(calendarScopePicker.type)}</Text>
                  </div>
                )}
              </div>
            </Space>
          ) : null}
        </Modal>
        <Drawer
          title={lifecycleEditor?.displayName || '生命周期配置'}
          open={Boolean(lifecycleEditor)}
          onClose={() => setLifecycleEditor(null)}
          width={760}
          loading={editorLoading}
        >
          {lifecycleEditor ? (
            <Space
              direction="vertical"
              size={16}
              className="operations-config-suite-layout"
              data-testid="operation-config-lifecycle-threshold-editor"
            >
              <div className="operation-config-lifecycle-editor-header" data-testid="operation-config-lifecycle-editor-header">
                <div className="operation-config-version-editor-header-main">
                  <Space>
                    {configTypeTag(lifecycleEditor)}
                    {statusTag(lifecycleEditor)}
                  </Space>
                  <div className="operation-config-version-editor-meta">
                    <Input
                      data-testid="operation-config-lifecycle-display-name"
                      value={lifecycleEditor.displayName || ''}
                      placeholder="版本名称"
                      onChange={(event) => updateLifecycleEditorMeta({ displayName: event.target.value })}
                    />
                    <Input
                      data-testid="operation-config-lifecycle-summary"
                      value={lifecycleEditor.summary || ''}
                      placeholder="摘要"
                      onChange={(event) => updateLifecycleEditorMeta({ summary: event.target.value })}
                    />
                  </div>
                </div>
              </div>
              <Space direction="vertical" size={12}>
                {lifecycleEditor.items.map((item, index) => (
                  <div className="operation-config-lifecycle-version-editor-row" key={`${item.groupName || 'row'}-${index}`}>
                    <div className="operation-config-lifecycle-readonly-cell" data-testid={`operation-config-lifecycle-item-group-${index}`}>
                      <Tag color={lifecycleStageTagColor(item.groupName)}>{`[${item.groupName || '默认阶段'}]`}</Tag>
                    </div>
                    <div className="operation-config-lifecycle-name-cell" data-testid={`operation-config-lifecycle-item-name-${index}`}>
                      <Text>{lifecycleItemDisplayName(item)}</Text>
                    </div>
                    <Input
                      data-testid={`operation-config-lifecycle-item-default-value-${index}`}
                      value={item.defaultValue || ''}
                      placeholder="阈值"
                      onChange={(event) => updateLifecycleItem(index, { defaultValue: event.target.value })}
                    />
                  </div>
                ))}
              </Space>
              <Space>
                <Button onClick={() => setLifecycleEditor(null)} disabled={editorSaving}>
                  取消
                </Button>
                <Button type="primary" data-testid="operation-config-lifecycle-save" loading={editorSaving} onClick={saveLifecycleEditor}>
                  保存
                </Button>
              </Space>
            </Space>
          ) : null}
        </Drawer>
        <Modal
          title="发布确认"
          open={Boolean(publishCandidate)}
          onCancel={() => setPublishCandidate(null)}
          footer={[
            <Button key="cancel" onClick={() => setPublishCandidate(null)} disabled={Boolean(publishingVersionNo)}>
              取消
            </Button>,
            <Button
              key="publish"
              type="primary"
              data-testid="operation-config-publish-confirm-submit"
              loading={Boolean(publishingVersionNo)}
              onClick={confirmPublish}
            >
              确认发布
            </Button>
          ]}
        >
          {publishCandidate ? (
            <Space direction="vertical" size={8} data-testid="operation-config-publish-confirm">
              <Text>配置类型：{publishCandidate.configTypeLabel}</Text>
              <Text>版本名称：{publishCandidate.displayName}</Text>
              <Text>范围：{publishCandidate.scopeSummary || '未设置范围'}</Text>
              <Text>摘要：{publishCandidate.summary || `${publishCandidate.itemCount} 项`}</Text>
              <Text type="secondary">发布后将成为当前版本；同类型同范围的旧当前版本会转为历史。</Text>
            </Space>
          ) : null}
        </Modal>
      </Space>
    </section>
  )
}
