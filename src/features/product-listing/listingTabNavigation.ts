export type ProductListingTabOpener = (
  url: string,
  target?: string,
  features?: string
) => Window | null

export type ProductListingTabReservation = {
  navigate: () => boolean
  close: () => void
}

export type ProductListingCurrentTabNavigator = (targetUrl: string) => void

export function navigateProductListingTargetInCurrentTab(
  targetUrl: string,
  navigate: ProductListingCurrentTabNavigator = (url) => window.location.assign(url)
) {
  // Embedded browsers can expose a WindowProxy without creating a visible
  // tab. Recovery entries therefore use deterministic same-tab navigation.
  navigate(targetUrl)
  return targetUrl
}

export function reserveProductListingTargetInNewTab(
  targetUrl: string,
  opener: ProductListingTabOpener = (url, target, features) => window.open(url, target, features)
): ProductListingTabReservation | null {
  // The blank tab must be created synchronously from the click. Awaiting source
  // preparation first causes browsers to treat window.open as an unsolicited popup.
  const opened = opener('about:blank', '_blank')
  if (!opened) {
    return null
  }
  try {
    opened.opener = null
  } catch {
    // Some browsers expose opener as read-only.
  }
  return {
    navigate: () => {
      try {
        opened.location.replace(targetUrl)
        return true
      } catch {
        return false
      }
    },
    close: () => {
      try {
        opened.close()
      } catch {
        // The user may already have closed the reserved tab.
      }
    }
  }
}

export function openProductListingTargetInNewTab(
  targetUrl: string,
  opener: ProductListingTabOpener = (url, target, features) => window.open(url, target, features)
) {
  const opened = opener(targetUrl, '_blank')
  if (!opened) {
    return false
  }
  try {
    opened.opener = null
  } catch {
    // Some browsers expose opener as read-only.
  }
  return true
}
