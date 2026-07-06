import type { ProductListingTaskView } from './types'

export type ProductListingTaskRecovery = {
  dryRunTask?: ProductListingTaskView
  realRunTask?: ProductListingTaskView
}

export function recoverProductListingTasksFromRecent(tasks: ProductListingTaskView[] = []): ProductListingTaskRecovery {
  const ordered = [...tasks].sort(compareTaskRecencyDesc)
  const dryRunTask = ordered.find((task) => task.mode === 'DRY_RUN')
  if (!dryRunTask) {
    return {
      realRunTask: ordered.find((task) => task.mode === 'REAL_RUN')
    }
  }
  return {
    dryRunTask,
    realRunTask: ordered.find((task) => task.mode === 'REAL_RUN' && task.sourceTaskId === dryRunTask.taskId)
  }
}

function compareTaskRecencyDesc(left: ProductListingTaskView, right: ProductListingTaskView) {
  const leftTime = timestamp(left.submittedAt)
  const rightTime = timestamp(right.submittedAt)
  if (leftTime !== rightTime) {
    return rightTime - leftTime
  }
  return right.taskId - left.taskId
}

function timestamp(value?: string) {
  if (!value) {
    return 0
  }
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}
