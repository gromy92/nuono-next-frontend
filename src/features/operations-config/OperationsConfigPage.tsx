import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Drawer, Empty, Input, InputNumber, Modal, Select, Space, Spin, Switch, Table, Tag, Tooltip, Typography } from 'antd'
import { DownOutlined, ReloadOutlined, UpOutlined } from '@ant-design/icons'
import type { AuthSession } from '../auth/session'
import {
  batchUpdateOperationCalendarRules,
  copyPreviousYearOperationCalendarRules,
  disableOperationCalendarRule,
  fetchActiveOperationCalendarRules,
  createOperationLifecycleRuleDraftFromCurrent,
  fetchOperationCalendarRuleHistory,
  fetchOperationConfigProductDimensionOptions,
  fetchOperationConfigScope,
  fetchOperationLifecycleRuleState,
  publishOperationCalendarRuleDraft,
  publishOperationLifecycleRuleDraft,
  recalculateOperationLifecycle,
  saveOperationCalendarRuleDraft,
  saveOperationLifecycleRuleDraft
} from './api'
import type {
  OperationCalendarRule,
  OperationCalendarRuleScopeQuery,
  OperationConfigProductDimensionOptionsView,
  OperationConfigPageKind,
  OperationConfigScopeView,
  OperationConfigStoreScope,
  OperationLifecycleRecalculationJob,
  OperationLifecycleRuleStateView,
  OperationLifecycleRuleThresholds
} from './types'
import './OperationsConfigPage.css'

const { Text, Title } = Typography

type OperationsConfigPageProps = {
  session: AuthSession
  pageKind: OperationConfigPageKind
}

type LoadState =
  | { status: 'loading'; scope?: OperationConfigScopeView; error?: string }
  | { status: 'success'; scope: OperationConfigScopeView; error?: string }
  | { status: 'error'; scope?: OperationConfigScopeView; error: string }

type CalendarDraftFormState = {
  ruleName: string
  activityType: string
  dateFrom: string
  dateTo: string
  recurringExpression: string
  factorValue: number | null
  factorPurpose: string
  enabled: boolean
}

type CalendarDraftMode = 'create' | 'edit'

type CalendarStatusFilter = 'all' | 'active' | 'draft' | 'disabled' | 'published'

type CalendarFactorTemplate = {
  key: string
  role: string
  cadence: string
  content: string
  valueType: string
  factorCadence: string
  factorName: string
  result: string
  activityType: string
  targetScopeType: string
  factorPurpose: string
  recurringExpression?: string
}

const PAGE_META: Record<OperationConfigPageKind, { title: string; empty: string }> = {
  'business-calendar': {
    title: '业务日历',
    empty: '当前范围暂无已发布业务日历'
  },
  'lifecycle-rules': {
    title: '生命周期配置',
    empty: '当前范围暂无已发布生命周期规则'
  }
}

const ACTIVITY_TYPE_OPTIONS = [
  { value: 'holiday', label: '节日' },
  { value: 'marketplace_event', label: '平台大促' },
  { value: 'payday', label: '薪酬日' },
  { value: 'seasonal', label: '季节' },
  { value: 'custom', label: '自定义活动' }
]

const FACTOR_PURPOSE_OPTIONS = [
  { value: 'demand_uplift', label: '需求提升' },
  { value: 'demand_suppression', label: '需求抑制' },
  { value: 'manual_override', label: '人工修正' }
]

const TARGET_SCOPE_OPTIONS = [
  { value: 'all_products', label: '全部商品' },
  { value: 'brand', label: '品牌' },
  { value: 'category', label: '类目' },
  { value: 'product_fulltype', label: 'Product Fulltype' },
  { value: 'psku', label: '指定 PSKU' }
]

function scopeKey(store: OperationConfigStoreScope) {
  return `${store.ownerUserId}|${store.storeCode}|${store.siteCode}`
}

function storeLabel(store: OperationConfigStoreScope) {
  const project = store.projectName || store.projectCode || `老板 ${store.ownerUserId}`
  if (store.storeCode === '*' && store.siteCode === '*') {
    return `${project} / 全部店铺`
  }
  return `${project} / ${store.storeCode} / ${store.siteCode}`
}

function selectedStoreFromScope(scope?: OperationConfigScopeView) {
  if (!scope?.defaultStoreCode || !scope.defaultSiteCode || !scope.defaultOwnerUserId) {
    return undefined
  }
  return `${scope.defaultOwnerUserId}|${scope.defaultStoreCode}|${scope.defaultSiteCode}`
}

function calendarRuleBusinessStatus(rule: OperationCalendarRule): CalendarStatusFilter {
  if (rule.publishStatus === 'DRAFT') {
    return 'draft'
  }
  if (rule.publishStatus === 'DISABLED' || !rule.enabled) {
    return 'disabled'
  }
  if (rule.publishStatus === 'PUBLISHED') {
    return 'active'
  }
  return 'published'
}

function calendarRuleBusinessStatusLabel(rule: OperationCalendarRule) {
  const status = calendarRuleBusinessStatus(rule)
  if (status === 'active') {
    return '当前生效'
  }
  if (status === 'draft') {
    return '草稿'
  }
  if (status === 'disabled') {
    return '已停用'
  }
  return '已发布'
}

function calendarRuleBusinessStatusColor(rule: OperationCalendarRule) {
  const status = calendarRuleBusinessStatus(rule)
  if (status === 'active') {
    return 'green'
  }
  if (status === 'draft') {
    return 'gold'
  }
  if (status === 'disabled') {
    return 'default'
  }
  return 'blue'
}

function calendarRuleTargetLabel(rule: OperationCalendarRule) {
  const typeLabel = TARGET_SCOPE_OPTIONS.find((option) => option.value === rule.targetScopeType)?.label ?? rule.targetScopeType
  return rule.targetScopeValue ? `${typeLabel}：${rule.targetScopeValue}` : typeLabel
}

function calendarRuleActivityTypeLabel(activityType: string) {
  return ACTIVITY_TYPE_OPTIONS.find((option) => option.value === activityType)?.label ?? activityType
}

function calendarRuleFactorPurposeLabel(factorPurpose: string) {
  return FACTOR_PURPOSE_OPTIONS.find((option) => option.value === factorPurpose)?.label ?? factorPurpose
}

function versionSourceLabel(sourceLabel?: string | null) {
  return sourceLabel || '运营发布'
}

function calendarRuleOverlapsYear(rule: OperationCalendarRule, yearText: string) {
  const year = Number(yearText)
  if (!Number.isFinite(year)) {
    return true
  }
  return rule.dateFrom <= `${year}-12-31` && rule.dateTo >= `${year}-01-01`
}

function defaultCalendarDraftForm(): CalendarDraftFormState {
  return {
    ruleName: '',
    activityType: 'holiday',
    dateFrom: '',
    dateTo: '',
    recurringExpression: '',
    factorValue: 1,
    factorPurpose: 'demand_uplift',
    enabled: true
  }
}

function currentBundleVersionIdFromLocation() {
  if (typeof window === 'undefined') {
    return null
  }
  const value = new URLSearchParams(window.location.search).get('bundleVersionId')
  const parsed = value ? Number(value) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const CALENDAR_FACTOR_TEMPLATES: CalendarFactorTemplate[] = [
  {
    key: 'ramadan',
    role: '系统管理员',
    cadence: '提前一年',
    content: '斋月 (Ramadan)',
    valueType: '日期范围',
    factorCadence: '每周',
    factorName: '节日爆发系数',
    result: '类目/系数',
    activityType: 'holiday',
    targetScopeType: 'all_products',
    factorPurpose: 'demand_uplift',
    recurringExpression: 'YEARLY:RAMADAN'
  },
  {
    key: 'eid-al-fitr',
    role: '系统管理员',
    cadence: '提前一年',
    content: '开斋节 (Eid al-Fitr)',
    valueType: '日期范围',
    factorCadence: '每周',
    factorName: '节日爆发系数',
    result: '类目/系数',
    activityType: 'holiday',
    targetScopeType: 'all_products',
    factorPurpose: 'demand_uplift',
    recurringExpression: 'YEARLY:EID_AL_FITR'
  },
  {
    key: 'eid-al-adha',
    role: '系统管理员',
    cadence: '提前一年',
    content: '古尔邦节 (Eid al-Adha)',
    valueType: '日期范围',
    factorCadence: '每周',
    factorName: '节日爆发系数',
    result: '类目/系数',
    activityType: 'holiday',
    targetScopeType: 'all_products',
    factorPurpose: 'demand_uplift',
    recurringExpression: 'YEARLY:EID_AL_ADHA'
  },
  {
    key: 'white-friday',
    role: '系统管理员',
    cadence: '提前一年',
    content: '白色星期五',
    valueType: '日期范围',
    factorCadence: '每周',
    factorName: '节日爆发系数',
    result: '类目/系数',
    activityType: 'marketplace_event',
    targetScopeType: 'all_products',
    factorPurpose: 'demand_uplift'
  },
  {
    key: 'yellow-friday',
    role: '系统管理员',
    cadence: '提前一年',
    content: '黄色星期五',
    valueType: '日期范围',
    factorCadence: '每周',
    factorName: '节日爆发系数',
    result: '类目/系数',
    activityType: 'marketplace_event',
    targetScopeType: 'all_products',
    factorPurpose: 'demand_uplift'
  },
  {
    key: 'eleven-eleven',
    role: '系统管理员',
    cadence: '提前一年',
    content: '双十一 (11.11)',
    valueType: '日期范围',
    factorCadence: '每周',
    factorName: '节日爆发系数',
    result: '类目/系数',
    activityType: 'marketplace_event',
    targetScopeType: 'all_products',
    factorPurpose: 'demand_uplift'
  },
  {
    key: 'back-to-school',
    role: '系统管理员',
    cadence: '提前一年',
    content: '开学季模式',
    valueType: '日期范围',
    factorCadence: '每周',
    factorName: '季节爆发系数',
    result: '类目/系数',
    activityType: 'seasonal',
    targetScopeType: 'all_products',
    factorPurpose: 'demand_uplift'
  },
  {
    key: 'summer-season',
    role: '系统管理员',
    cadence: '提前一年',
    content: '夏季模式',
    valueType: '日期范围',
    factorCadence: '每周',
    factorName: '季节爆发系数',
    result: '类目/系数',
    activityType: 'seasonal',
    targetScopeType: 'all_products',
    factorPurpose: 'demand_uplift'
  },
  {
    key: 'monthly-salary',
    role: '系统管理员',
    cadence: '每月5日',
    content: '月度薪酬爆发系数',
    valueType: '日期范围',
    factorCadence: '每月5日',
    factorName: '月度薪酬爆发系数',
    result: '类目/系数/日期',
    activityType: 'payday',
    targetScopeType: 'all_products',
    factorPurpose: 'demand_uplift',
    recurringExpression: 'MONTHLY:DAY_5'
  },
  {
    key: 'trend-decline',
    role: '运营',
    cadence: '上架选择',
    content: '流行产品关键词',
    valueType: '字符串或选择',
    factorCadence: '每3天',
    factorName: '流行产品衰退系数',
    result: '关键词/系数',
    activityType: 'custom',
    targetScopeType: 'psku',
    factorPurpose: 'manual_override'
  },
  {
    key: 'seasonal-product',
    role: '运营',
    cadence: '上架选择',
    content: '季节产品',
    valueType: '选择 夏季/雨季',
    factorCadence: '每周',
    factorName: '季节产品系数',
    result: '季节/系数',
    activityType: 'seasonal',
    targetScopeType: 'all_products',
    factorPurpose: 'demand_uplift'
  }
]

export function OperationsConfigPage({ session, pageKind }: OperationsConfigPageProps) {
  const meta = PAGE_META[pageKind]
  const bundleVersionId = useMemo(() => currentBundleVersionIdFromLocation(), [])
  const bundleMode = Boolean(bundleVersionId)
  const [selectedBossUserIds, setSelectedBossUserIds] = useState<number[]>([])
  const [selectedStoreKey, setSelectedStoreKey] = useState<string>()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [calendarRules, setCalendarRules] = useState<{ loading: boolean; items: OperationCalendarRule[]; error?: string }>({
    loading: false,
    items: []
  })
  const [calendarHistory, setCalendarHistory] = useState<{ loading: boolean; items: OperationCalendarRule[]; error?: string }>({
    loading: false,
    items: []
  })
  const [selectedCalendarRuleIds, setSelectedCalendarRuleIds] = useState<number[]>([])
  const [batchFactorValue, setBatchFactorValue] = useState<number | null>(null)
  const [calendarActionLoading, setCalendarActionLoading] = useState(false)
  const [calendarDraft, setCalendarDraft] = useState<CalendarDraftFormState>(() => defaultCalendarDraftForm())
  const [calendarDraftRule, setCalendarDraftRule] = useState<OperationCalendarRule>()
  const [calendarDraftModalOpen, setCalendarDraftModalOpen] = useState(false)
  const [calendarDraftMode, setCalendarDraftMode] = useState<CalendarDraftMode>('create')
  const [calendarPublishConfirmOpen, setCalendarPublishConfirmOpen] = useState(false)
  const [calendarAuditOpen, setCalendarAuditOpen] = useState(false)
  const [calendarYearFilter, setCalendarYearFilter] = useState(String(new Date().getFullYear()))
  const [calendarStatusFilter, setCalendarStatusFilter] = useState<CalendarStatusFilter>('all')
  const [calendarActivityTypeFilter, setCalendarActivityTypeFilter] = useState('all')
  const [calendarTargetScopeFilter, setCalendarTargetScopeFilter] = useState('all')
  const [targetScopeType, setTargetScopeType] = useState('all_products')
  const [targetScopeValue, setTargetScopeValue] = useState<string | string[] | undefined>()
  const [dimensionOptions, setDimensionOptions] = useState<{
    loading: boolean
    view?: OperationConfigProductDimensionOptionsView
    error?: string
  }>({ loading: false })
  const [lifecycleState, setLifecycleState] = useState<{
    loading: boolean
    view?: OperationLifecycleRuleStateView
    error?: string
  }>({ loading: false })
  const [lifecycleThresholds, setLifecycleThresholds] = useState<OperationLifecycleRuleThresholds>()
  const [lifecycleActionLoading, setLifecycleActionLoading] = useState(false)
  const [lifecyclePublishConfirmOpen, setLifecyclePublishConfirmOpen] = useState(false)
  const [lifecycleRecalculationJob, setLifecycleRecalculationJob] = useState<OperationLifecycleRecalculationJob>()
  const [scopeDetailsExpanded, setScopeDetailsExpanded] = useState(false)

  const loadScope = async (bossUserIds = selectedBossUserIds) => {
    setState((current) => ({ status: 'loading', scope: current.scope }))
    try {
      const scope = await fetchOperationConfigScope(bossUserIds)
      setState({ status: 'success', scope })
      setSelectedStoreKey(selectedStoreFromScope(scope))
      setScopeDetailsExpanded(false)
    } catch (error) {
      setState({
        status: 'error',
        error: error instanceof Error ? error.message : '运营配置范围读取失败'
      })
    }
  }

  useEffect(() => {
    void loadScope([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKind])

  useEffect(() => {
    setCalendarDraft(defaultCalendarDraftForm())
    setCalendarDraftRule(undefined)
    setCalendarDraftModalOpen(false)
    setCalendarDraftMode('create')
    setCalendarPublishConfirmOpen(false)
    setCalendarAuditOpen(false)
    setLifecyclePublishConfirmOpen(false)
    setSelectedCalendarRuleIds([])
    setTargetScopeType('all_products')
    setTargetScopeValue(undefined)
  }, [pageKind, selectedStoreKey])

  const scope = state.scope
  const selectedStore = useMemo(
    () => (scope?.stores ?? []).find((store) => scopeKey(store) === selectedStoreKey),
    [scope?.stores, selectedStoreKey]
  )
  const scopeHeaderLabel = scope?.systemAdmin ? '老板范围' : '版本作用范围'
  const scopeSecondaryText = scope?.systemAdmin
    ? selectedBossUserIds.length > 0
      ? bundleMode
        ? `${pageKind === 'lifecycle-rules' ? '生命周期规则' : '活动因子'}会随运营配置版本 #${bundleVersionId} 统一发布`
        : `系统会同步到 ${selectedBossUserIds.length} 个老板名下所有店铺`
      : '请选择老板范围'
    : bundleMode
      ? `${pageKind === 'lifecycle-rules' ? '生命周期规则' : '活动因子'}会随运营配置版本 #${bundleVersionId} 统一发布`
      : '作用店铺在运营配置版本中设置'
  const calendarRuleRows = useMemo(() => {
    const rowsById = new Map<number, OperationCalendarRule>()
    calendarHistory.items.forEach((rule) => rowsById.set(rule.id, rule))
    calendarRules.items.forEach((rule) => rowsById.set(rule.id, rule))
    return Array.from(rowsById.values()).sort((left, right) => {
      if (left.dateFrom !== right.dateFrom) {
        return left.dateFrom.localeCompare(right.dateFrom)
      }
      return left.id - right.id
    })
  }, [calendarHistory.items, calendarRules.items])
  const filteredCalendarRuleRows = useMemo(
    () =>
      calendarRuleRows.filter((rule) => {
        if (!calendarRuleOverlapsYear(rule, calendarYearFilter)) {
          return false
        }
        if (calendarStatusFilter !== 'all' && calendarRuleBusinessStatus(rule) !== calendarStatusFilter) {
          return false
        }
        if (calendarActivityTypeFilter !== 'all' && rule.activityType !== calendarActivityTypeFilter) {
          return false
        }
        if (calendarTargetScopeFilter !== 'all' && rule.targetScopeType !== calendarTargetScopeFilter) {
          return false
        }
        return true
      }),
    [calendarActivityTypeFilter, calendarRuleRows, calendarStatusFilter, calendarTargetScopeFilter, calendarYearFilter]
  )
  const calendarYearOptions = useMemo(() => {
    const years = new Set<string>([calendarYearFilter, String(new Date().getFullYear())])
    calendarRuleRows.forEach((rule) => {
      years.add(rule.dateFrom.slice(0, 4))
      years.add(rule.dateTo.slice(0, 4))
    })
    return Array.from(years)
      .filter(Boolean)
      .sort()
      .map((year) => ({ value: year, label: `${year} 年` }))
  }, [calendarRuleRows, calendarYearFilter])

  const calendarScopeQuery = (store: OperationConfigStoreScope): OperationCalendarRuleScopeQuery => ({
    bossUserIds: selectedBossUserIds,
    bundleVersionId,
    ownerUserId: store.ownerUserId,
    storeCode: store.storeCode,
    siteCode: store.siteCode
  })

  const reloadCalendarRules = async (store = selectedStore) => {
    if (pageKind !== 'business-calendar' || !store) {
      setCalendarRules({ loading: false, items: [] })
      setCalendarHistory({ loading: false, items: [] })
      setSelectedCalendarRuleIds([])
      return
    }
    setCalendarRules((current) => ({ ...current, loading: true, error: undefined }))
    setCalendarHistory((current) => ({ ...current, loading: true, error: undefined }))
    try {
      const query = calendarScopeQuery(store)
      const [activeItems, historyItems, nextDimensionOptions] = await Promise.all([
        fetchActiveOperationCalendarRules(query),
        fetchOperationCalendarRuleHistory(query),
        fetchOperationConfigProductDimensionOptions({ ...query, limit: 50 })
      ])
      setCalendarRules({ loading: false, items: activeItems })
      setCalendarHistory({ loading: false, items: historyItems })
      setDimensionOptions({ loading: false, view: nextDimensionOptions })
      const availableRuleIds = new Set([...activeItems, ...historyItems].map((rule) => rule.id))
      setSelectedCalendarRuleIds((current) =>
        current.filter((ruleId) => availableRuleIds.has(ruleId))
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : '业务日历读取失败'
      setCalendarRules({ loading: false, items: [], error: message })
      setCalendarHistory({ loading: false, items: [], error: message })
      setDimensionOptions({ loading: false, error: message })
    }
  }

  const reloadLifecycleState = async (store = selectedStore) => {
    if (pageKind !== 'lifecycle-rules' || !store) {
      setLifecycleState({ loading: false })
      setLifecycleThresholds(undefined)
      setLifecycleRecalculationJob(undefined)
      return
    }
    setLifecycleState((current) => ({ ...current, loading: true, error: undefined }))
    try {
      const view = await fetchOperationLifecycleRuleState(calendarScopeQuery(store))
      setLifecycleState({ loading: false, view })
      setLifecycleThresholds(view.draft?.thresholds ?? view.current.thresholds)
      setLifecycleRecalculationJob(undefined)
    } catch (error) {
      const message = error instanceof Error ? error.message : '生命周期规则读取失败'
      setLifecycleState({ loading: false, error: message })
      setLifecycleThresholds(undefined)
      setLifecycleRecalculationJob(undefined)
    }
  }

  useEffect(() => {
    let cancelled = false
    reloadCalendarRules(selectedStore)
      .then(() => {
        if (!cancelled) {
          return
        }
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKind, selectedBossUserIds, selectedStore])

  useEffect(() => {
    let cancelled = false
    reloadLifecycleState(selectedStore)
      .then(() => {
        if (!cancelled) {
          return
        }
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKind, selectedBossUserIds, selectedStore])

  const runCalendarAction = async (action: () => Promise<OperationCalendarRule[]>) => {
    if (!selectedStore) {
      return
    }
    setCalendarActionLoading(true)
    try {
      await action()
      await reloadCalendarRules(selectedStore)
    } catch (error) {
      const message = error instanceof Error ? error.message : '业务日历操作失败'
      setCalendarRules((current) => ({ ...current, error: message }))
    } finally {
      setCalendarActionLoading(false)
    }
  }

  const copyPreviousYear = () => {
    if (!selectedStore) {
      return
    }
    const targetYear = new Date().getFullYear()
    void runCalendarAction(() =>
      copyPreviousYearOperationCalendarRules({
        ...calendarScopeQuery(selectedStore),
        sourceYear: targetYear - 1,
        targetYear
      })
    )
  }

  const batchUpdateEnabled = (enabled: boolean) => {
    if (!selectedStore || !selectedCalendarRuleIds.length) {
      return
    }
    void runCalendarAction(() =>
      batchUpdateOperationCalendarRules({
        ...calendarScopeQuery(selectedStore),
        ruleIds: selectedCalendarRuleIds,
        enabled
      })
    )
  }

  const batchUpdateFactor = () => {
    if (!selectedStore || !selectedCalendarRuleIds.length || batchFactorValue == null) {
      return
    }
    void runCalendarAction(() =>
      batchUpdateOperationCalendarRules({
        ...calendarScopeQuery(selectedStore),
        ruleIds: selectedCalendarRuleIds,
        factorValue: batchFactorValue
      })
    )
  }

  const openCreateCalendarDraft = () => {
    setCalendarDraft(defaultCalendarDraftForm())
    setCalendarDraftRule(undefined)
    setCalendarDraftMode('create')
    setTargetScopeType('all_products')
    setTargetScopeValue(undefined)
    setCalendarDraftModalOpen(true)
  }

  const closeCalendarEditor = () => {
    setCalendarDraftModalOpen(false)
    setCalendarPublishConfirmOpen(false)
  }

  const calendarTargetValue = () => {
    if (targetScopeType === 'all_products') {
      return null
    }
    if (Array.isArray(targetScopeValue)) {
      return targetScopeValue.filter(Boolean).join(',')
    }
    return targetScopeValue || null
  }

  const canSaveCalendarDraft =
    Boolean(selectedStore) &&
    Boolean(calendarDraft.ruleName.trim()) &&
    Boolean(calendarDraft.dateFrom) &&
    Boolean(calendarDraft.dateTo) &&
    calendarDraft.factorValue != null &&
    calendarDraft.factorValue > 0 &&
    (targetScopeType === 'all_products' || Boolean(calendarTargetValue()))

  const saveCalendarDraft = async () => {
    if (!selectedStore || !canSaveCalendarDraft || calendarDraft.factorValue == null) {
      return
    }
    setCalendarActionLoading(true)
    try {
      const saved = await saveOperationCalendarRuleDraft({
        ...calendarScopeQuery(selectedStore),
        id: calendarDraftRule?.publishStatus === 'DRAFT' ? calendarDraftRule.id : null,
        ruleName: calendarDraft.ruleName.trim(),
        activityType: calendarDraft.activityType,
        dateFrom: calendarDraft.dateFrom,
        dateTo: calendarDraft.dateTo,
        recurringExpression: calendarDraft.recurringExpression.trim() || null,
        targetScopeType,
        targetScopeValue: calendarTargetValue(),
        factorValue: calendarDraft.factorValue,
        factorPurpose: calendarDraft.factorPurpose,
        enabled: calendarDraft.enabled
      })
      setCalendarDraftRule(saved)
      await reloadCalendarRules(selectedStore)
    } catch (error) {
      const message = error instanceof Error ? error.message : '业务日历草稿保存失败'
      setCalendarRules((current) => ({ ...current, error: message }))
    } finally {
      setCalendarActionLoading(false)
    }
  }

  const publishCalendarDraft = async () => {
    if (!selectedStore || !calendarDraftRule?.id || calendarDraftRule.publishStatus !== 'DRAFT') {
      return
    }
    setCalendarActionLoading(true)
    try {
      const published = await publishOperationCalendarRuleDraft(calendarDraftRule.id, {
        bossUserIds: selectedBossUserIds,
        message: 'publish business calendar factor'
      })
      setCalendarDraftRule(published)
      await reloadCalendarRules(selectedStore)
      setCalendarDraftModalOpen(false)
      setCalendarPublishConfirmOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : '业务日历版本发布失败'
      setCalendarRules((current) => ({ ...current, error: message }))
    } finally {
      setCalendarActionLoading(false)
    }
  }

  const openPublishConfirm = (rule?: OperationCalendarRule) => {
    if (rule) {
      setCalendarDraftRule(rule)
      setCalendarDraft({
        ruleName: rule.ruleName,
        activityType: rule.activityType,
        dateFrom: rule.dateFrom,
        dateTo: rule.dateTo,
        recurringExpression: rule.recurringExpression ?? '',
        factorValue: rule.factorValue,
        factorPurpose: rule.factorPurpose,
        enabled: rule.enabled
      })
      setTargetScopeType(rule.targetScopeType)
      setTargetScopeValue(rule.targetScopeType === 'psku' ? (rule.targetScopeValue?.split(/[,，\s]+/).filter(Boolean) ?? []) : (rule.targetScopeValue ?? undefined))
    }
    setCalendarPublishConfirmOpen(true)
  }

  const applyCalendarTemplate = (template: CalendarFactorTemplate) => {
    setCalendarDraft((current) => ({
      ...current,
      ruleName: template.content,
      activityType: template.activityType,
      recurringExpression: template.recurringExpression ?? '',
      factorPurpose: template.factorPurpose,
      enabled: true
    }))
    setTargetScopeType(template.targetScopeType)
    setTargetScopeValue(undefined)
    setCalendarDraftRule(undefined)
    setCalendarDraftMode('create')
    setCalendarDraftModalOpen(true)
  }

  const editCalendarRule = (rule: OperationCalendarRule) => {
    setCalendarDraft({
      ruleName: rule.ruleName,
      activityType: rule.activityType,
      dateFrom: rule.dateFrom,
      dateTo: rule.dateTo,
      recurringExpression: rule.recurringExpression ?? '',
      factorValue: rule.factorValue,
      factorPurpose: rule.factorPurpose,
      enabled: rule.enabled
    })
    setTargetScopeType(rule.targetScopeType)
    setTargetScopeValue(rule.targetScopeType === 'psku' ? (rule.targetScopeValue?.split(/[,，\s]+/).filter(Boolean) ?? []) : (rule.targetScopeValue ?? undefined))
    setCalendarDraftRule(rule.publishStatus === 'DRAFT' ? rule : undefined)
    setCalendarDraftMode('edit')
    setCalendarDraftModalOpen(true)
  }

  const disableCalendarRule = async (rule: OperationCalendarRule) => {
    if (!rule.id) {
      return
    }
    setCalendarActionLoading(true)
    try {
      await disableOperationCalendarRule(rule.id, {
        bossUserIds: selectedBossUserIds,
        message: 'disable business calendar factor'
      })
      if (calendarDraftRule?.id === rule.id) {
        setCalendarDraftRule(undefined)
      }
      await reloadCalendarRules(selectedStore)
    } catch (error) {
      const message = error instanceof Error ? error.message : '业务日历规则停用失败'
      setCalendarRules((current) => ({ ...current, error: message }))
    } finally {
      setCalendarActionLoading(false)
    }
  }

  const createLifecycleDraft = async () => {
    if (!selectedStore) {
      return
    }
    setLifecycleActionLoading(true)
    try {
      await createOperationLifecycleRuleDraftFromCurrent(calendarScopeQuery(selectedStore))
      await reloadLifecycleState(selectedStore)
    } catch (error) {
      setLifecycleState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : '生命周期规则草稿创建失败'
      }))
    } finally {
      setLifecycleActionLoading(false)
    }
  }

  const saveLifecycleDraft = async () => {
    if (!selectedStore || !lifecycleThresholds) {
      return
    }
    setLifecycleActionLoading(true)
    try {
      await saveOperationLifecycleRuleDraft({
        ...calendarScopeQuery(selectedStore),
        id: lifecycleState.view?.draft?.id ?? null,
        thresholds: lifecycleThresholds
      })
      await reloadLifecycleState(selectedStore)
    } catch (error) {
      setLifecycleState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : '生命周期规则草稿保存失败'
      }))
    } finally {
      setLifecycleActionLoading(false)
    }
  }

  const publishLifecycleDraft = async () => {
    const draftId = lifecycleState.view?.draft?.id
    if (!draftId) {
      return
    }
    setLifecycleActionLoading(true)
    try {
      await publishOperationLifecycleRuleDraft(draftId, {
        bossUserIds: selectedBossUserIds,
        message: 'publish lifecycle thresholds'
      })
      await reloadLifecycleState(selectedStore)
      setLifecyclePublishConfirmOpen(false)
    } catch (error) {
      setLifecycleState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : '生命周期规则发布失败'
      }))
    } finally {
      setLifecycleActionLoading(false)
    }
  }

  const recalculateLifecycle = async () => {
    const currentRuleVersion = lifecycleState.view?.current.ruleVersion
    if (!selectedStore || !currentRuleVersion) {
      return
    }
    setLifecycleActionLoading(true)
    try {
      const job = await recalculateOperationLifecycle({
        ...calendarScopeQuery(selectedStore),
        anchorDate: yesterdayDateText(),
        selectedRuleVersion: currentRuleVersion
      })
      setLifecycleRecalculationJob(job)
      await reloadLifecycleState(selectedStore)
      setLifecycleRecalculationJob(job)
    } catch (error) {
      setLifecycleState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : '生命周期重算失败'
      }))
    } finally {
      setLifecycleActionLoading(false)
    }
  }

  const updateLifecycleThreshold = (field: keyof OperationLifecycleRuleThresholds, value: number | null) => {
    setLifecycleThresholds((current) => {
      if (!current) {
        return current
      }
      return {
        ...current,
        [field]: value == null ? 0 : value
      }
    })
  }

  const bossOptions = useMemo(
    () =>
      (scope?.bossOptions ?? []).map((boss) => ({
        value: boss.ownerUserId,
        label: boss.displayName || boss.accountNo || `老板 ${boss.ownerUserId}`
      })),
    [scope?.bossOptions]
  )

  const emptyText =
    scope?.emptyReason === 'SELECT_BOSS'
      ? '请选择老板范围'
      : scope?.emptyReason === 'NO_STORE'
        ? '当前账号暂无可配置店铺'
        : meta.empty
  const calendarDraftTargetSummary =
    targetScopeType === 'all_products'
      ? '全部商品'
      : `${TARGET_SCOPE_OPTIONS.find((option) => option.value === targetScopeType)?.label ?? targetScopeType}：${calendarTargetValue() ?? '未选择'}`
  const calendarDraftYearSummary = calendarDraft.dateFrom ? calendarDraft.dateFrom.slice(0, 4) : calendarYearFilter

  return (
    <div className="operations-config-page" data-testid="operations-config-scope-shell">
      <Space className="operations-config-header" align="center">
        <div>
          <Title data-testid="operations-config-page-title" level={4} style={{ margin: 0 }}>
            {meta.title}
          </Title>
          <Text type="secondary">{session.realName || session.accountNo}</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void loadScope()} />
        </Space>
      </Space>

      {state.status === 'error' ? <Alert showIcon type="warning" message={state.error} /> : null}
      {calendarRules.error ? <Alert showIcon type="warning" message={calendarRules.error} /> : null}
      {calendarHistory.error && calendarHistory.error !== calendarRules.error ? (
        <Alert showIcon type="warning" message={calendarHistory.error} />
      ) : null}
      {dimensionOptions.error && dimensionOptions.error !== calendarRules.error ? (
        <Alert showIcon type="warning" message={dimensionOptions.error} />
      ) : null}
      {lifecycleState.error ? <Alert showIcon type="warning" message={lifecycleState.error} /> : null}

      <div className="operations-config-scope-bar">
        <Space wrap className="operations-config-scope-controls">
          {scope?.systemAdmin ? (
            <Select
              data-testid="operations-config-boss-select"
              allowClear
              placeholder="老板范围"
              className="operations-config-boss-select"
              options={bossOptions}
              value={selectedBossUserIds[0]}
              onChange={(nextBossUserId) => {
                const nextBossUserIds = nextBossUserId ? [nextBossUserId] : []
                setSelectedBossUserIds(nextBossUserIds)
                void loadScope(nextBossUserIds)
              }}
            />
          ) : null}
        </Space>
        {selectedStore ? (
          <div className="operations-config-scope-summary" data-testid="operations-config-scope-summary">
            <div className="operations-config-scope-summary-main">
                <Text strong>{scopeHeaderLabel}</Text>
              {bundleMode ? (
                <Tag color="purple" data-testid="operation-calendar-bundle-context">
                  运营配置版本 #{bundleVersionId}
                </Tag>
              ) : null}
              {scope?.systemAdmin ? (
                <Tooltip title={storeLabel(selectedStore)}>
                  <Tag color="blue" className="operations-config-scope-current-tag">
                    {storeLabel(selectedStore)}
                  </Tag>
                </Tooltip>
              ) : (
                <Tag color="blue" className="operations-config-scope-current-tag">
                  由版本设置
                </Tag>
              )}
              <Text type="secondary">{scopeSecondaryText}</Text>
            </div>
            {scope?.systemAdmin && scope.stores.length ? (
              <Button
                type="link"
                icon={scopeDetailsExpanded ? <UpOutlined /> : <DownOutlined />}
                onClick={() => setScopeDetailsExpanded((current) => !current)}
              >
                {scopeDetailsExpanded ? '收起范围明细' : '展开范围明细'}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {state.status === 'loading' && !scope ? <Spin size="small" /> : null}

      {scope && !scope.stores.length ? (
        <Empty data-testid="operations-config-empty-state" image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
      ) : null}

      {scope && scope.systemAdmin && scope.stores.length && scopeDetailsExpanded ? (
        <div className="operations-config-section operations-config-scope-detail">
          <Table
            data-testid="operations-config-scope-table"
            rowKey={(record) => scopeKey(record)}
            size="small"
            pagination={false}
            dataSource={scope.stores}
            columns={[
              {
                title: '老板',
                dataIndex: 'ownerUserId',
                width: 100
              },
              {
                title: '店铺',
                render: (_, record) => (
                  <Tooltip title={record.projectName || record.projectCode || record.storeCode}>
                    <span className="operations-config-store-name">
                      {record.projectName || record.projectCode || record.storeCode}
                    </span>
                  </Tooltip>
                )
              },
              {
                title: '站点',
                render: (_, record) => `${record.storeCode} / ${record.siteCode}`,
                width: 220
              },
              {
                title: '状态',
                width: 120,
                render: (_, record) => (scopeKey(record) === selectedStoreKey ? <Tag color="green">当前</Tag> : <Tag>可选</Tag>)
              }
            ]}
          />
        </div>
      ) : null}

      {pageKind === 'business-calendar' && selectedStore ? (
        <div className="operations-config-workbench">
          <div className="operations-config-section operation-calendar-work-context" data-testid="operation-calendar-work-context">
            <div className="operations-config-section-heading">
              <div>
                <Title level={5}>规则维护工作台</Title>
                <Text type="secondary">
                  {bundleMode ? '在当前运营配置版本内维护活动因子，发布入口在版本详情页。' : '先确认店铺、年份和状态，再维护活动因子。'}
                </Text>
              </div>
              <Space wrap className="operations-config-toolbar" data-testid="operation-calendar-workbench-toolbar">
                <Button type="primary" data-testid="operation-calendar-add-button" onClick={openCreateCalendarDraft}>
                  增加一条
                </Button>
                {!bundleMode ? (
                  <Button loading={calendarActionLoading} onClick={copyPreviousYear}>
                    复制上一年
                  </Button>
                ) : null}
                <Button data-testid="operation-calendar-audit-button" onClick={() => setCalendarAuditOpen(true)}>
                  历史审计
                </Button>
              </Space>
            </div>
            <div className="operation-calendar-filter-grid">
              <Select
                data-testid="operation-calendar-year-filter"
                aria-label="年份"
                value={calendarYearFilter}
                onChange={setCalendarYearFilter}
                options={calendarYearOptions}
              />
              <Select
                data-testid="operation-calendar-status-filter"
                aria-label="状态"
                value={calendarStatusFilter}
                onChange={setCalendarStatusFilter}
                options={[
                  { value: 'all', label: '全部状态' },
                  { value: 'active', label: '当前生效' },
                  { value: 'draft', label: '草稿' },
                  { value: 'disabled', label: '已停用' },
                  { value: 'published', label: '已发布' }
                ]}
              />
              <Select
                data-testid="operation-calendar-activity-type-filter"
                aria-label="活动类型筛选"
                value={calendarActivityTypeFilter}
                onChange={setCalendarActivityTypeFilter}
                options={[{ value: 'all', label: '全部类型' }, ...ACTIVITY_TYPE_OPTIONS]}
              />
              <Select
                data-testid="operation-calendar-target-scope-filter"
                aria-label="目标范围筛选"
                value={calendarTargetScopeFilter}
                onChange={setCalendarTargetScopeFilter}
                options={[{ value: 'all', label: '全部目标范围' }, ...TARGET_SCOPE_OPTIONS]}
              />
            </div>
          </div>
          <div className="operations-config-section operation-calendar-rule-workbench">
            <div className="operations-config-section-heading">
              <div>
                <Title level={5}>活动因子规则</Title>
                <Text type="secondary">当前范围共 {filteredCalendarRuleRows.length} 条，草稿和生效规则在同一张表维护。</Text>
              </div>
            </div>
            {selectedCalendarRuleIds.length ? (
              <Space wrap className="operation-calendar-batch-action-bar" data-testid="operation-calendar-batch-action-bar">
                <Tag color="blue">已选 {selectedCalendarRuleIds.length} 条</Tag>
                <Button loading={calendarActionLoading} onClick={() => batchUpdateEnabled(true)}>
                  启用
                </Button>
                <Button loading={calendarActionLoading} onClick={() => batchUpdateEnabled(false)}>
                  停用
                </Button>
                <InputNumber
                  aria-label="批量因子"
                  min={0.01}
                  step={0.05}
                  precision={2}
                  value={batchFactorValue}
                  onChange={(value) => setBatchFactorValue(value == null ? null : Number(value))}
                />
                <Button
                  loading={calendarActionLoading}
                  disabled={batchFactorValue == null}
                  onClick={batchUpdateFactor}
                >
                  批量调整因子
                </Button>
              </Space>
            ) : null}
            <Table
              data-testid="operation-calendar-rules-table"
              rowKey="id"
              size="small"
              loading={calendarRules.loading || calendarHistory.loading}
              pagination={false}
              dataSource={filteredCalendarRuleRows}
              rowSelection={{
                selectedRowKeys: selectedCalendarRuleIds,
                onChange: (keys) => setSelectedCalendarRuleIds(keys.map((key) => Number(key)))
              }}
              columns={calendarWorkbenchRuleColumns({
                edit: editCalendarRule,
                publish: openPublishConfirm,
                disable: (rule) => void disableCalendarRule(rule),
                actionLoading: calendarActionLoading,
                bundleMode
              })}
              locale={{
                emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={calendarRules.loading ? '读取中' : meta.empty} />
              }}
            />
          </div>
          <Drawer
            title={calendarDraftMode === 'edit' ? '编辑活动因子' : '增加一条'}
            aria-label={calendarDraftMode === 'edit' ? '编辑活动因子' : '增加一条'}
            open={calendarDraftModalOpen}
            width={760}
            destroyOnClose
            onClose={closeCalendarEditor}
          >
            <div data-testid="operation-calendar-editor-drawer">
              <div className="operation-calendar-editor-section">
                <Text strong>模板辅助</Text>
                <Select
                  data-testid="operation-calendar-template-helper"
                  placeholder="从模板填充"
                  allowClear
                  className="operation-calendar-template-helper"
                  value={undefined}
                  onChange={(templateKey) => {
                    const template = CALENDAR_FACTOR_TEMPLATES.find((item) => item.key === templateKey)
                    if (template) {
                      applyCalendarTemplate(template)
                    }
                  }}
                  options={CALENDAR_FACTOR_TEMPLATES.map((template) => ({
                    value: template.key,
                    label: template.content
                  }))}
                />
              </div>
              <div className="operation-calendar-editor-section">
                <Text strong>基础信息</Text>
                <div className="operation-calendar-draft-form" data-testid="operation-calendar-draft-form">
                  <Input
                    aria-label="活动名称"
                    placeholder="活动名称"
                    value={calendarDraft.ruleName}
                    onChange={(event) => setCalendarDraft((current) => ({ ...current, ruleName: event.target.value }))}
                  />
                  <Select
                    data-testid="operation-calendar-activity-type-select"
                    aria-label="活动类型"
                    value={calendarDraft.activityType}
                    onChange={(activityType) => setCalendarDraft((current) => ({ ...current, activityType }))}
                    options={ACTIVITY_TYPE_OPTIONS}
                  />
                  <Input
                    aria-label="开始日期"
                    type="date"
                    value={calendarDraft.dateFrom}
                    onChange={(event) => setCalendarDraft((current) => ({ ...current, dateFrom: event.target.value }))}
                  />
                  <Input
                    aria-label="结束日期"
                    type="date"
                    value={calendarDraft.dateTo}
                    onChange={(event) => setCalendarDraft((current) => ({ ...current, dateTo: event.target.value }))}
                  />
                </div>
              </div>
              <div className="operation-calendar-editor-section">
                <Text strong>应用目标</Text>
                <Space wrap className="operations-config-toolbar operation-calendar-modal-toolbar">
                  <Select
                    data-testid="operation-calendar-target-type-select"
                    className="operation-calendar-target-type-select"
                    value={targetScopeType}
                    onChange={(nextType) => {
                      setTargetScopeType(nextType)
                      setTargetScopeValue(undefined)
                    }}
                    options={TARGET_SCOPE_OPTIONS}
                  />
                  <Select
                    data-testid="operation-calendar-target-option-select"
                    mode={targetScopeType === 'psku' ? 'tags' : undefined}
                    showSearch
                    allowClear
                    loading={dimensionOptions.loading}
                    disabled={targetScopeType === 'all_products'}
                    placeholder={targetScopeType === 'all_products' ? '全部商品' : '选择目标'}
                    className="operation-calendar-target-option-select"
                    value={targetScopeValue}
                    onChange={setTargetScopeValue}
                    options={targetOptions(targetScopeType, dimensionOptions.view)}
                  />
                  <Input
                    aria-label="循环规则"
                    placeholder="循环规则，可选"
                    className="operation-calendar-recurring-input"
                    value={calendarDraft.recurringExpression}
                    onChange={(event) =>
                      setCalendarDraft((current) => ({ ...current, recurringExpression: event.target.value }))
                    }
                  />
                </Space>
              </div>
              <div className="operation-calendar-editor-section">
                <Text strong>因子与用途</Text>
                <Space wrap className="operations-config-toolbar">
                  <InputNumber
                    aria-label="活动因子"
                    min={0.01}
                    step={0.05}
                    precision={2}
                    value={calendarDraft.factorValue}
                    onChange={(value) =>
                      setCalendarDraft((current) => ({ ...current, factorValue: value == null ? null : Number(value) }))
                    }
                  />
                  <Select
                    aria-label="因子用途"
                    value={calendarDraft.factorPurpose}
                    className="operation-calendar-factor-purpose-select"
                    onChange={(factorPurpose) => setCalendarDraft((current) => ({ ...current, factorPurpose }))}
                    options={FACTOR_PURPOSE_OPTIONS}
                  />
                  <Switch
                    aria-label="启用活动"
                    checkedChildren="启用"
                    unCheckedChildren="停用"
                    checked={calendarDraft.enabled}
                    onChange={(enabled) => setCalendarDraft((current) => ({ ...current, enabled }))}
                  />
                </Space>
              </div>
              <Space className="operation-calendar-draft-actions" wrap>
                {calendarDraftRule ? (
                  <Tag color={calendarDraftRule.publishStatus === 'DRAFT' ? 'gold' : 'green'}>
                    {bundleMode
                      ? `套装内规则 ${calendarDraftRule.id}`
                      : calendarDraftRule.publishStatus === 'DRAFT'
                        ? `草稿 ${calendarDraftRule.id}`
                        : `已发布 ${calendarDraftRule.id}`}
                  </Tag>
                ) : null}
                <Button
                  data-testid="operation-calendar-draft-cancel"
                  disabled={calendarActionLoading}
                  onClick={closeCalendarEditor}
                >
                  取消
                </Button>
                <Button loading={calendarActionLoading} disabled={!canSaveCalendarDraft} onClick={saveCalendarDraft}>
                  保存为草稿
                </Button>
                {bundleMode ? (
                  <Text type="secondary">保存后随运营配置版本统一发布</Text>
                ) : (
                  <Button
                    type="primary"
                    loading={calendarActionLoading}
                    disabled={!calendarDraftRule || calendarDraftRule.publishStatus !== 'DRAFT'}
                    onClick={() => openPublishConfirm()}
                  >
                    发布版本
                  </Button>
                )}
              </Space>
            </div>
          </Drawer>
          <Modal
            title="发布确认"
            open={calendarPublishConfirmOpen}
            onCancel={() => setCalendarPublishConfirmOpen(false)}
            footer={[
              <Button key="cancel" onClick={() => setCalendarPublishConfirmOpen(false)}>
                取消
              </Button>,
              <Button key="confirm" type="primary" loading={calendarActionLoading} onClick={publishCalendarDraft}>
                确认发布
              </Button>
            ]}
          >
            <div data-testid="operation-calendar-publish-confirm" className="operation-calendar-publish-confirm">
              <Text>{scope?.systemAdmin ? '应用老板范围' : '应用店铺'}：{storeLabel(selectedStore)}</Text>
              <Text>版本来源：{scope?.systemAdmin ? '系统发布' : versionSourceLabel(calendarDraftRule?.publishSourceLabel)}</Text>
              <Text>年份：{calendarDraftYearSummary}</Text>
              <Text>目标范围：{calendarDraftTargetSummary}</Text>
              <Text type="secondary">发布后会成为该范围后续预测和生命周期订正可引用的配置版本。</Text>
            </div>
          </Modal>
          <Drawer
            title="历史审计"
            aria-label="历史审计"
            open={calendarAuditOpen}
            width={860}
            extra={
              <Button data-testid="operation-calendar-audit-close" onClick={() => setCalendarAuditOpen(false)}>
                关闭
              </Button>
            }
            onClose={() => setCalendarAuditOpen(false)}
          >
            <div data-testid="operation-calendar-audit-drawer">
              <Title level={5}>历史审计</Title>
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={calendarHistory.items}
                columns={calendarAuditRuleColumns()}
                locale={{
                  emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无历史审计记录" />
                }}
              />
            </div>
          </Drawer>
        </div>
      ) : null}

      {pageKind === 'lifecycle-rules' && selectedStore ? (
        <div className="operations-config-workbench">
          <div className="operations-config-section operation-lifecycle-version-panel" data-testid="operation-lifecycle-version-panel">
            <div className="operations-config-section-heading">
              <div>
                <Title level={5}>当前生命周期规则</Title>
                <Space wrap>
                  <Tag data-testid="operation-lifecycle-current-version" color={lifecycleState.view?.current.fallback ? 'gold' : 'green'}>
                    {lifecycleState.view?.current.ruleVersion ?? '读取中'}
                  </Tag>
                  <Tag color={lifecycleState.view?.current.publishSourceLabel === '系统发布' ? 'blue' : 'default'}>
                    {versionSourceLabel(lifecycleState.view?.current.publishSourceLabel)}
                  </Tag>
                  <Tag>{lifecycleState.view?.impactScope ?? `${selectedStore.ownerUserId}/${selectedStore.storeCode}/${selectedStore.siteCode}`}</Tag>
                </Space>
              </div>
              <Space wrap>
                <Button loading={lifecycleActionLoading} onClick={createLifecycleDraft}>
                  从当前版本创建草稿
                </Button>
                <Button
                  loading={lifecycleActionLoading}
                  disabled={!lifecycleState.view?.draft || !lifecycleThresholds}
                  onClick={saveLifecycleDraft}
                >
                  保存草稿
                </Button>
                <Button
                  loading={lifecycleActionLoading}
                  disabled={!lifecycleState.view?.draft}
                  onClick={bundleMode ? undefined : () => setLifecyclePublishConfirmOpen(true)}
                  type={bundleMode ? 'default' : 'primary'}
                >
                  {bundleMode ? '随版本统一发布' : '发布版本'}
                </Button>
                {!bundleMode ? (
                  <Button
                    loading={lifecycleActionLoading}
                    disabled={!lifecycleState.view?.current.ruleVersion}
                    onClick={recalculateLifecycle}
                  >
                    重算生命周期
                  </Button>
                ) : null}
              </Space>
            </div>
            {lifecycleRecalculationJob ? (
              <Alert
                data-testid="operation-lifecycle-recalculation-result"
                showIcon
                type={lifecycleRecalculationJob.status === 'succeeded' ? 'success' : 'warning'}
                message={`重算结果：${lifecycleRecalculationJob.status} / ${lifecycleRecalculationJob.ruleVersion} / ${lifecycleRecalculationJob.processedCount}`}
              />
            ) : null}
            {lifecycleState.view?.current.fallback ? (
              <Alert data-testid="operation-lifecycle-fallback-alert" showIcon type="info" message="当前使用 DEFAULT_V1" />
            ) : null}
            <Modal
              title="发布确认"
              open={lifecyclePublishConfirmOpen}
              onCancel={() => setLifecyclePublishConfirmOpen(false)}
              footer={[
                <Button key="cancel" onClick={() => setLifecyclePublishConfirmOpen(false)}>
                  取消
                </Button>,
                <Button key="confirm" type="primary" loading={lifecycleActionLoading} onClick={publishLifecycleDraft}>
                  确认发布
                </Button>
              ]}
            >
              <div data-testid="operation-lifecycle-publish-confirm" className="operation-calendar-publish-confirm">
                <Text>{scope?.systemAdmin ? '应用老板范围' : '应用店铺'}：{storeLabel(selectedStore)}</Text>
                <Text>版本来源：{scope?.systemAdmin ? '系统发布' : versionSourceLabel(lifecycleState.view?.draft?.publishSourceLabel)}</Text>
                <Text>规则版本：{lifecycleState.view?.draft?.ruleVersion ?? '未创建草稿'}</Text>
                <Text type="secondary">发布只影响后续解析；生命周期重算需单独触发。</Text>
              </div>
            </Modal>
          </div>
          <div className="operations-config-section" data-testid="operation-lifecycle-threshold-table">
            <div className="operations-config-section-heading">
              <div>
                <Title level={5}>阈值配置</Title>
                <Text type="secondary">按生命周期阶段维护当前值和草稿值。</Text>
              </div>
            </div>
            <div className="operation-lifecycle-stage-sections" data-testid="operation-lifecycle-stage-sections">
              {LIFECYCLE_THRESHOLD_GROUPS.map((group) => (
                <div
                  key={group.slug}
                  className="operation-lifecycle-stage-section"
                  data-testid={`operation-lifecycle-stage-${group.slug}`}
                >
                  <div className="operation-lifecycle-stage-title">{group.label}</div>
                  <div className="operation-lifecycle-threshold-grid operation-lifecycle-threshold-grid-header">
                    <Text type="secondary">阈值</Text>
                    <Text type="secondary">当前值</Text>
                    <Text type="secondary">草稿值</Text>
                  </div>
                  {group.fields.map((record) => (
                    <div key={record.field} className="operation-lifecycle-threshold-grid">
                      <Text>{record.label}</Text>
                      <Text>{valueText(lifecycleState.view?.current.thresholds[record.field])}</Text>
                      <InputNumber
                        data-testid={`operation-lifecycle-threshold-${record.field}`}
                        aria-label={record.label}
                        disabled={!lifecycleState.view?.draft}
                        min={record.min}
                        step={record.step}
                        precision={record.precision}
                        value={lifecycleThresholds?.[record.field] ?? 0}
                        onChange={(value) => updateLifecycleThreshold(record.field, value == null ? null : Number(value))}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="operations-config-section">
            <div className="operations-config-section-heading">
              <Title level={5}>版本差异</Title>
            </div>
            <Table
              data-testid="operation-lifecycle-diff-table"
              rowKey="field"
              size="small"
              loading={lifecycleState.loading}
              pagination={false}
              dataSource={lifecycleState.view?.diffs ?? []}
              columns={[
                { title: '阈值', dataIndex: 'label' },
                { title: '发布值', dataIndex: 'beforeValue', width: 160 },
                { title: '草稿值', dataIndex: 'afterValue', width: 160 }
              ]}
              locale={{
                emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无差异" />
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

type CalendarRuleActions = {
  edit: (rule: OperationCalendarRule) => void
  publish: (rule: OperationCalendarRule) => void
  disable: (rule: OperationCalendarRule) => void
  actionLoading: boolean
  bundleMode?: boolean
}

function calendarWorkbenchRuleColumns(actions: CalendarRuleActions) {
  return [
    {
      title: '名称',
      dataIndex: 'ruleName'
    },
    {
      title: '类型',
      width: 120,
      render: (_: unknown, record: OperationCalendarRule) => calendarRuleActivityTypeLabel(record.activityType)
    },
    {
      title: '日期',
      width: 220,
      render: (_: unknown, record: OperationCalendarRule) => `${record.dateFrom} ~ ${record.dateTo}`
    },
    {
      title: '目标范围',
      width: 220,
      render: (_: unknown, record: OperationCalendarRule) => calendarRuleTargetLabel(record)
    },
    {
      title: '因子',
      dataIndex: 'factorValue',
      width: 100
    },
    {
      title: '用途',
      width: 140,
      render: (_: unknown, record: OperationCalendarRule) => calendarRuleFactorPurposeLabel(record.factorPurpose)
    },
    {
      title: '状态',
      width: 140,
      render: (_: unknown, record: OperationCalendarRule) => (
        <Tag color={calendarRuleBusinessStatusColor(record)}>{calendarRuleBusinessStatusLabel(record)}</Tag>
      )
    },
    {
      title: '来源',
      width: 120,
      render: (_: unknown, record: OperationCalendarRule) => (
        <Tag color={record.publishSourceLabel === '系统发布' ? 'blue' : 'default'}>{versionSourceLabel(record.publishSourceLabel)}</Tag>
      )
    },
    {
      title: '版本',
      width: 130,
      render: (_: unknown, record: OperationCalendarRule) => (
        <Text type="secondary">
          {actions.bundleMode ? `套装内 #${record.id}` : record.publishStatus === 'DRAFT' ? `草稿 #${record.id}` : `规则 #${record.id}`}
        </Text>
      )
    },
    {
      title: '操作',
      width: 210,
      render: (_: unknown, record: OperationCalendarRule) => (
        <Space size={4}>
          <Button
            size="small"
            data-testid={`operation-calendar-edit-${record.id}`}
            onClick={() => actions.edit(record)}
          >
            {record.publishStatus === 'DRAFT' ? '编辑' : '复制为草稿'}
          </Button>
          {!actions.bundleMode && record.publishStatus === 'DRAFT' ? (
            <Button
              size="small"
              type="primary"
              loading={actions.actionLoading}
              data-testid={`operation-calendar-publish-${record.id}`}
              onClick={() => actions.publish(record)}
            >
              发布
            </Button>
          ) : null}
          {!actions.bundleMode ? (
            <Button
              danger
              size="small"
              loading={actions.actionLoading}
              disabled={calendarRuleBusinessStatus(record) === 'disabled'}
              data-testid={`operation-calendar-disable-${record.id}`}
              onClick={() => actions.disable(record)}
            >
              停用
            </Button>
          ) : null}
        </Space>
      )
    }
  ]
}

function calendarAuditRuleColumns() {
  return [
    {
      title: '名称',
      dataIndex: 'ruleName'
    },
    {
      title: '日期',
      width: 220,
      render: (_: unknown, record: OperationCalendarRule) => `${record.dateFrom} ~ ${record.dateTo}`
    },
    {
      title: '目标范围',
      width: 220,
      render: (_: unknown, record: OperationCalendarRule) => calendarRuleTargetLabel(record)
    },
    {
      title: '因子',
      dataIndex: 'factorValue',
      width: 90
    },
    {
      title: '状态',
      width: 120,
      render: (_: unknown, record: OperationCalendarRule) => (
        <Tag color={calendarRuleBusinessStatusColor(record)}>{calendarRuleBusinessStatusLabel(record)}</Tag>
      )
    },
    {
      title: '来源',
      width: 120,
      render: (_: unknown, record: OperationCalendarRule) => versionSourceLabel(record.publishSourceLabel)
    }
  ]
}

function targetOptions(targetScopeType: string, view?: OperationConfigProductDimensionOptionsView) {
  if (targetScopeType === 'brand') {
    return (view?.brands ?? []).map((option) => ({
      value: option.value,
      label: option.label || option.value,
      title: option.label || option.value
    }))
  }
  if (targetScopeType === 'product_fulltype') {
    return (view?.productFulltypes ?? []).map((option) => ({
      value: option.value,
      label: option.label || option.value,
      title: option.label || option.value
    }))
  }
  if (targetScopeType === 'category') {
    return (view?.categories ?? []).map((option) => ({
      value: option.value,
      label: option.label || option.value,
      title: option.label || option.value
    }))
  }
  return []
}

const LIFECYCLE_THRESHOLD_FIELDS: Array<{
  group: string
  field: keyof OperationLifecycleRuleThresholds
  label: string
  min?: number
  step?: number
  precision?: number
}> = [
  { group: '新品期', field: 'newMaxAgeDays', label: '新品期最长周期', min: 0, step: 1, precision: 0 },
  { group: '新品期', field: 'newMinAgeDays', label: '新品期最小周期', min: 0, step: 1, precision: 0 },
  { group: '新品期', field: 'highPriceThreshold', label: '高客单价阈值', min: 0, step: 10, precision: 2 },
  { group: '成长期', field: 'growthMinSalesGrowthRate', label: '成长期最小销量环比增长率', step: 0.05, precision: 4 },
  { group: '成长期', field: 'growthMinPvGrowthRate', label: '成长期最小浏览环比增长率', step: 0.05, precision: 4 },
  { group: '成长期', field: 'growthMinMonthlySales', label: '成长期最小月销量', min: 0, step: 1, precision: 0 },
  { group: '成长期', field: 'growthMinActiveSalesDays', label: '成长期最小月动销天数', min: 0, step: 1, precision: 0 },
  { group: '成长期', field: 'growthMaxVolatility', label: '成长期最大波动率', min: 0, step: 0.05, precision: 4 },
  { group: '稳定期', field: 'stableMinPvGrowthRate', label: '稳定期最小浏览环比增长率', step: 0.05, precision: 4 },
  { group: '稳定期', field: 'stableVolatilityMin', label: '稳定期波动率下限', min: 0, step: 0.05, precision: 4 },
  { group: '稳定期', field: 'stableVolatilityMax', label: '稳定期波动率上限', min: 0, step: 0.05, precision: 4 },
  { group: '衰退期', field: 'declineMaxVolatility', label: '衰退期最大波动率', min: 0, step: 0.05, precision: 4 },
  { group: '衰退期', field: 'declineMaxSalesGrowthRate', label: '衰退销量环比阈值', step: 0.05, precision: 4 },
  { group: '长尾期', field: 'longTailMaxVolatility', label: '长尾期最大波动率', min: 0, step: 0.05, precision: 4 },
  { group: '长尾期', field: 'longTailMaxMonthlySales', label: '长尾期最大月销量', min: 0, step: 1, precision: 0 }
]

const LIFECYCLE_THRESHOLD_GROUPS = [
  { label: '新品期', slug: 'new-products' },
  { label: '成长期', slug: 'growth' },
  { label: '稳定期', slug: 'stable' },
  { label: '衰退期', slug: 'decline' },
  { label: '长尾期', slug: 'long-tail' }
].map((group) => ({
  ...group,
  fields: LIFECYCLE_THRESHOLD_FIELDS.filter((field) => field.group === group.label)
}))

function valueText(value: number | undefined) {
  return value == null ? '' : String(value)
}

function yesterdayDateText() {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return date.toISOString().slice(0, 10)
}

export function BusinessCalendarConfigPage({ session }: { session: AuthSession }) {
  return <OperationsConfigPage session={session} pageKind="business-calendar" />
}

export function LifecycleRulesConfigPage({ session }: { session: AuthSession }) {
  return <OperationsConfigPage session={session} pageKind="lifecycle-rules" />
}
