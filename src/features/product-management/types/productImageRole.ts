export type ProductImageUsageRole = 'MAIN' | 'SIZE' | 'DETAIL' | 'SCENE' | 'PACKAGE'

export type ProductImageRoleAssignment = {
  imageUrl: string
  imageRole: ProductImageUsageRole
  sortOrder?: number
}
