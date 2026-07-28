export const DASHBOARD_COLORS = ['#2563eb', '#f59e0b', '#dc2626', '#0891b2', '#16a34a', '#7c3aed']
export const DASHBOARD_TOOLTIP_BASE = {
  appendToBody: false,
  confine: true,
  enterable: true,
  extraCssText: [
    'max-width:420px',
    'white-space:normal',
    'word-break:break-word',
    'overflow-wrap:anywhere',
    'line-height:1.45',
    'pointer-events:auto',
    'user-select:text'
  ].join(';'),
  hideDelay: 400,
  transitionDuration: 0
}

export function chartDataItem(params: unknown) {
  if (Array.isArray(params)) {
    return chartDataItem(params[0])
  }
  if (typeof params === 'object' && params) {
    return params as { dataIndex?: number }
  }
  return { dataIndex: 0 }
}

export function escapeDashboardHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
