import type { ReactNode } from 'react'
import type { AuthSession } from '../auth/session'

export type OperationConfigVersionConfigType = 'BUSINESS_CALENDAR' | 'PRODUCT_LIFECYCLE'

export type OperationConfigVersionLibraryPageProps = {
  session: AuthSession
  configType?: OperationConfigVersionConfigType
  title?: string
}

export type CalendarItemPreset = {
  groupName: string
  itemName: string
  valueType: string | null
  resultShape: string | null
}

export type CalendarScopeType = 'all_products' | 'brand' | 'product_fulltype' | 'category'

export type CalendarScopePickerState = {
  index: number
  type: CalendarScopeType
  query: string
}

export type CalendarScopePickerOption = {
  value: string
  label: ReactNode
  title: string
  searchText: string
}

export const CALENDAR_SCOPE_OPTIONS: Array<{ value: CalendarScopeType; label: string; requiresValue: boolean }> = [
  { value: 'all_products', label: '全品', requiresValue: false },
  { value: 'brand', label: '品牌', requiresValue: true },
  { value: 'product_fulltype', label: 'Product Fulltype', requiresValue: true },
  { value: 'category', label: '类目', requiresValue: true }
]

export const CALENDAR_ITEM_PRESETS: CalendarItemPreset[] = [
  { groupName: '业务日历', itemName: '斋月 (Ramadan)', valueType: '日期范围', resultShape: null },
  { groupName: '业务日历', itemName: '开斋节 (Eid al-Fitr)', valueType: '日期范围', resultShape: null },
  { groupName: '业务日历', itemName: '古尔邦节 (Eid al-Adha)', valueType: '日期范围', resultShape: null },
  { groupName: '业务日历', itemName: '白色星期五', valueType: '日期范围', resultShape: null },
  { groupName: '业务日历', itemName: '黄色星期五', valueType: '日期范围', resultShape: null },
  { groupName: '业务日历', itemName: '双十一 (11.11)', valueType: '日期范围', resultShape: null },
  { groupName: '业务日历', itemName: '开学季模式', valueType: '日期范围', resultShape: null },
  { groupName: '业务日历', itemName: '夏季模式', valueType: '日期范围', resultShape: null }
]
