export type ProductListingTabOpener = (
  url: string,
  target?: string,
  features?: string
) => Window | null

export function openProductListingTargetInNewTab(
  targetUrl: string,
  opener: ProductListingTabOpener = (url, target, features) => window.open(url, target, features)
) {
  const opened = opener(targetUrl, '_blank', 'noopener,noreferrer')
  if (opened) {
    try {
      opened.opener = null
    } catch {
      // Some browsers expose opener as read-only for noopener windows.
    }
  }
  return Boolean(opened)
}
