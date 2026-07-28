import dayjs, { type Dayjs } from 'dayjs'
import type { AuthSession } from '../../auth/session'

export type SalesAnalyticsPageProps = {
  session: AuthSession
  mode?: 'analytics' | 'activity-config'
}

export type DateRangeValue = [Dayjs, Dayjs]
export type DetailRangePreset = 'week' | 'month' | 'halfYear' | 'year' | 'custom'

export type ActivityWindowFormValues = {
  name: string
  activityType: string
  categoryScope?: string
  dateRange: DateRangeValue
  factor: number
  enabled: boolean
}

export const detailRangePresetOptions: Array<{
  label: string
  value: DetailRangePreset
}> = [
  { label: '最近一周', value: 'week' },
  { label: '最近一个月', value: 'month' },
  { label: '最近半年', value: 'halfYear' },
  { label: '最近一年', value: 'year' },
  { label: '自定义', value: 'custom' }
]

const latestCompleteDay = () => dayjs().subtract(1, 'day')

export function initialDateRange(): DateRangeValue {
  const end = latestCompleteDay()
  return [end.subtract(29, 'day'), end]
}

export function detailRangeForPreset(
  preset: Exclude<DetailRangePreset, 'custom'>
): DateRangeValue {
  const end = latestCompleteDay()
  if (preset === 'week') return [end.subtract(6, 'day'), end]
  if (preset === 'halfYear') return [end.subtract(6, 'month').add(1, 'day'), end]
  if (preset === 'year') return [end.subtract(1, 'year').add(1, 'day'), end]
  return [end.subtract(29, 'day'), end]
}
