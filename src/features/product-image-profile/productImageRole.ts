/**
 * Roles assignable to images in product drafts and the product image manager.
 *
 * This intentionally excludes the profile asset role `OTHER`: listing drafts only
 * persist the five publishable image positions.
 */
export type ProductImageUsageRole = 'MAIN' | 'SIZE' | 'DETAIL' | 'SCENE' | 'PACKAGE'

export type ProductImageRoleAssignment = {
  imageUrl: string
  imageRole: ProductImageUsageRole
  sortOrder?: number
}
