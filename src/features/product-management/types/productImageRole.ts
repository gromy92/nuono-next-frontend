export type ProductImageUsageRole = 'MAIN' | 'SIZE' | 'DETAIL' | 'PACKAGE'

export type ProductImageRoleAssignment = {
  imageUrl: string
  imageRole: ProductImageUsageRole
  sortOrder?: number
}
