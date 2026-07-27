type ProductListingWorkflowRefreshEventTarget = {
  addEventListener: (type: 'focus' | 'pageshow', listener: () => void) => void
  removeEventListener: (type: 'focus' | 'pageshow', listener: () => void) => void
}

export function subscribeProductListingWorkflowRefresh(
  target: ProductListingWorkflowRefreshEventTarget,
  onRefresh: () => void
) {
  target.addEventListener('focus', onRefresh)
  target.addEventListener('pageshow', onRefresh)
  return () => {
    target.removeEventListener('focus', onRefresh)
    target.removeEventListener('pageshow', onRefresh)
  }
}
