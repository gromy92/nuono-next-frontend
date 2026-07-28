import type {
  ProcurementFeedbackEntry,
  ProcurementMockRole,
  PreviewScenario
} from './types'

export { createMockDemandBatches } from './mockDemandBatches'

export const procurementRequirementRoleOptions: Array<{ label: string; value: ProcurementMockRole }> = [
  { label: '采购', value: 'buyer' },
  { label: '运营', value: 'operations' },
  { label: '运营管理', value: 'ops-manager' }
]

export const procurementRequirementScenarioOptions: Array<{ label: string; value: PreviewScenario }> = [
  { label: '正常', value: 'normal' },
  { label: '加载', value: 'loading' },
  { label: '空状态', value: 'empty' },
  { label: '报错', value: 'error' },
  { label: '权限不足', value: 'forbidden' }
]

export function createMockFeedbackEntries(): ProcurementFeedbackEntry[] {
  return [
    {
      id: 'feedback-01',
      tone: 'info',
      title: '采购需求已进入确认',
      description: '当前需求已生成默认待选池，并自动开始询价。',
      createdAt: '2026-04-28 16:20'
    },
    {
      id: 'feedback-02',
      tone: 'warning',
      title: '最终候选待确认',
      description: '当前仍需确认最终 2 个候选是否区分主选与备选。',
      createdAt: '2026-04-28 16:24'
    }
  ]
}
