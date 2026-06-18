import type { InTransitBatch, InTransitGoodsLine, InTransitBoxDetailTabRequest } from './types'
import type { AuthSession } from '../auth/session'

export type PageState =
  | { status: 'idle' | 'loading'; data?: InTransitBatch[]; message?: string }
  | { status: 'success'; data: InTransitBatch[]; message?: string }
  | { status: 'error'; data?: InTransitBatch[]; message: string }

export type BatchListMeta = {
  totalCount: number
  page: number
  pageSize: number
}

export type InTransitBoxGroup = {
  boxNo: string
  externalBoxNo: string
  packageTrackingNo: string
  packageStatus: string
  logisticsStatus: string
  lines: InTransitGoodsLine[]
  pskuCount: number
  shippedQuantityTotal: number
  receivedQuantityTotal: number
  remainingQuantityTotal: number
  cartonCountTotal: number | null
  packageSpec: {
    sizeCm: string
    weightKg: string
    volumeCbm: string
  }
  measuredSpec: {
    sizeCm: string
    weightKg: string
    volumeCbm: string
  }
}

export type InTransitProductGroup = {
  psku: string
  productTitle?: string | null
  productName?: string | null
  productImageUrl?: string | null
  storeValues: string[]
  lines: InTransitGoodsLine[]
  boxCount: number
  shippedQuantityTotal: number
  receivedQuantityTotal: number
  remainingQuantityTotal: number
  cartonCountTotal: number | null
}

export type BoxDetailTabKey = 'box' | 'product'

export type InTransitGoodsPageProps = {
  session?: AuthSession | null
  isBoxDetailTab?: boolean
  boxDetailRequest?: InTransitBoxDetailTabRequest | null
  onOpenBoxDetailTab?: (request: InTransitBoxDetailTabRequest) => void
  onCloseBoxDetailTab?: () => Promise<void> | void
}
