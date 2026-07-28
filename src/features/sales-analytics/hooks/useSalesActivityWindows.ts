import { App, Form } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import {
  fetchActiveSalesActivityWindows,
  fetchSalesActivityWindowHistory,
  saveSalesActivityWindow
} from '../api'
import type { SalesActivityWindow, SalesAnalyticsQuery } from '../types'
import type { ActivityWindowFormValues, DateRangeValue } from '../model/pageTypes'
import { activityPayloadFromForm } from '../presentation/activityPresentation'

export function useSalesActivityWindows(
  query: SalesAnalyticsQuery | null,
  dateRange: DateRangeValue
) {
  const { message } = App.useApp()
  const [activityForm] = Form.useForm<ActivityWindowFormValues>()
  const [activityWindows, setActivityWindows] = useState<SalesActivityWindow[]>([])
  const [activityHistory, setActivityHistory] = useState<SalesActivityWindow[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [activitySaving, setActivitySaving] = useState(false)
  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<SalesActivityWindow | null>(null)

  const loadActivities = useCallback(async () => {
    if (!query) return
    setActivityLoading(true)
    try {
      const [snapshot, history] = await Promise.all([
        fetchActiveSalesActivityWindows(query),
        fetchSalesActivityWindowHistory(query)
      ])
      setActivityWindows(snapshot.windows || [])
      setActivityHistory(history || [])
    } catch (error) {
      message.error(error instanceof Error ? error.message : '活动配置加载失败')
    } finally {
      setActivityLoading(false)
    }
  }, [message, query])

  useEffect(() => {
    void loadActivities()
  }, [loadActivities])

  function openActivityModal(window?: SalesActivityWindow) {
    setEditingActivity(window || null)
    activityForm.setFieldsValue({
      name: window?.name || '',
      activityType: window?.activityType || 'holiday',
      categoryScope: window?.categoryScope || '',
      dateRange: window ? [dayjs(window.dateFrom), dayjs(window.dateTo)] : dateRange,
      factor: Number(window?.factor ?? 1),
      enabled: window?.enabled ?? true
    })
    setActivityModalOpen(true)
  }

  async function submitActivity() {
    if (!query) return
    const values = await activityForm.validateFields()
    setActivitySaving(true)
    try {
      await saveSalesActivityWindow(
        activityPayloadFromForm(query, values, editingActivity?.id)
      )
      message.success('活动配置已保存')
      setActivityModalOpen(false)
      await loadActivities()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '活动配置保存失败')
    } finally {
      setActivitySaving(false)
    }
  }

  async function toggleActivity(window: SalesActivityWindow) {
    if (!query) return
    setActivitySaving(true)
    try {
      await saveSalesActivityWindow({
        id: window.id,
        storeCode: query.storeCode,
        siteCode: query.siteCode,
        name: window.name,
        activityType: window.activityType,
        categoryScope: window.categoryScope || undefined,
        dateFrom: window.dateFrom,
        dateTo: window.dateTo,
        factor: Number(window.factor),
        enabled: !window.enabled
      })
      await loadActivities()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '活动状态保存失败')
    } finally {
      setActivitySaving(false)
    }
  }

  return {
    activityForm,
    activityWindows,
    activityHistory,
    activityLoading,
    activitySaving,
    activityModalOpen,
    setActivityModalOpen,
    editingActivity,
    loadActivities,
    openActivityModal,
    submitActivity,
    toggleActivity
  }
}
