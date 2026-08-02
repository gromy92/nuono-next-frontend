import {
  createLatestRequestGate,
  type LatestRequestIdentity
} from '../../shared/latestRequestGate'

type PackingRequestScope = Readonly<{
  epoch: number
  batchId: string
}>

export type PackingRequestTicket = Readonly<{
  epoch: number
  identity: LatestRequestIdentity<PackingRequestScope>
  scope: PackingRequestScope
}>

export class WarehousePackingRequestSupersededError extends Error {
  constructor() {
    super('装箱数据请求已被更新的请求替代。')
    this.name = 'WarehousePackingRequestSupersededError'
  }
}

export function createPackingRequestEpochGate() {
  let epoch = 0
  const latestRequestGate = createLatestRequestGate<PackingRequestScope>()

  return {
    begin(batchId: string): PackingRequestTicket {
      const scope = Object.freeze({ epoch, batchId: String(batchId) })
      return { epoch, scope, identity: latestRequestGate.begin(scope) }
    },
    invalidate() {
      epoch += 1
      latestRequestGate.invalidate()
      return epoch
    },
    isCurrent(ticket: PackingRequestTicket) {
      return ticket.epoch === epoch
        && latestRequestGate.isCurrent(ticket.identity, ticket.scope)
    },
    isEpochCurrent(candidateEpoch: number) {
      return candidateEpoch === epoch
    },
    requireCurrent(ticket: PackingRequestTicket) {
      if (ticket.epoch !== epoch
        || !latestRequestGate.isCurrent(ticket.identity, ticket.scope)) {
        throw new WarehousePackingRequestSupersededError()
      }
    }
  }
}

export function isWarehousePackingRequestSuperseded(error: unknown) {
  return error instanceof WarehousePackingRequestSupersededError
}
