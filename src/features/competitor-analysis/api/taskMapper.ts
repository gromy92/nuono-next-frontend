import type { CompetitorRefreshRun, CompetitorTask } from './contracts'
import { optionalId } from './transportValues'

export function mapRefreshRun(payload: CompetitorRefreshRun): CompetitorRefreshRun {
  return {
    ...payload,
    taskId: optionalId(payload.taskId),
    runId: optionalId(payload.runId),
    watchProductId: optionalId(payload.watchProductId)
  }
}

export function mapTask(payload: CompetitorTask): CompetitorTask {
  return {
    ...payload,
    taskId: optionalId(payload.taskId)
  }
}
