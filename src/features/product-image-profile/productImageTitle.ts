import { buildProductImageShortTitleAr, buildProductImageShortTitleEn } from './aiCopyText'

function editedTitle(value?: string | null) {
  return value?.trim() ?? ''
}

export function resolveProductImageShortTitleAr(
  manualTitle?: string | null,
  productTitle?: string | null
) {
  return editedTitle(manualTitle) || buildProductImageShortTitleAr(productTitle)
}

export function resolveProductImageShortTitleEn(
  manualTitle?: string | null,
  productTitle?: string | null
) {
  return editedTitle(manualTitle) || buildProductImageShortTitleEn(productTitle)
}
