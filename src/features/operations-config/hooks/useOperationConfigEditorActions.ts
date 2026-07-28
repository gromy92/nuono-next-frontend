import { updateOperationConfigVersion } from '../api'
import { CALENDAR_ITEM_PRESETS } from '../versionLibraryTypes'
import type { OperationConfigDefaultVersionItem, OperationConfigVersionDetail } from '../types'
import { detailToRow } from '../calendarConfigDomain'
import { normalizeCalendarItem } from '../versionLibraryPresentation'
import type { useOperationConfigLibraryController } from './useOperationConfigLibraryController'

export function useOperationConfigEditorActions(
  state: ReturnType<typeof useOperationConfigLibraryController>
) {
  const {
    calendarEditor, setCalendarEditor, lifecycleEditor, setLifecycleEditor,
    setEditorSaving, setVersions, setDetail, shouldKeepVersion, setError,
    closeCalendarVersionEditor
  } = state
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

  return {
    updateCalendarItem, updateCalendarEditorMeta, addCalendarItem, removeCalendarItem,
    saveCalendarEditor, updateLifecycleItem, updateLifecycleEditorMeta, saveLifecycleEditor
  }
}
