export type OperationsSkinStatus = 'ACTIVE' | 'INACTIVE'

export type OperationsSkinAssetView = {
  id?: number
  assetType?: string | null
  imageUrl: string
  caption?: string | null
  sortOrder?: number | null
  createdAt?: string | null
}

export type OperationsSkinComponentView = {
  id?: number
  templateRole: string
  componentKey: string
  imageUrl?: string | null
  x?: number | null
  y?: number | null
  width?: number | null
  height?: number | null
  zIndex?: number | null
  required?: boolean | null
  locked?: boolean | null
  styleJson?: string | null
}

export type OperationsSkinView = {
  id: number
  ownerUserId?: number
  storeCode: string
  skinName: string
  status: OperationsSkinStatus
  coverImageUrl?: string | null
  styleDescription?: string | null
  remark?: string | null
  assets: OperationsSkinAssetView[]
  heroComponentCount?: number | null
  heroComponentRequiredCount?: number | null
  components?: OperationsSkinComponentView[] | null
  createdAt?: string | null
  updatedAt?: string | null
}

export type OperationsSkinQuery = {
  storeCode: string
  status?: OperationsSkinStatus
  keyword?: string
}

export type OperationsSkinSaveRequest = {
  storeCode: string
  skinName: string
  status: OperationsSkinStatus
  coverImageUrl?: string | null
  styleDescription?: string | null
  remark?: string | null
  assets: OperationsSkinAssetView[]
}

export type OperationsSkinStatusRequest = {
  storeCode: string
  status: OperationsSkinStatus
}

export type OperationsSkinComponentsSaveRequest = {
  storeCode: string
  components: OperationsSkinComponentView[]
}

export type OperationsSkinAssetUploadResponse = {
  url: string
}
