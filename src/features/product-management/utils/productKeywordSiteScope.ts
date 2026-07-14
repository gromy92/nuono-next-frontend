const SITE_LABEL_PATTERN = /^[A-Z]{2,3}$/;

export function siteCodeFromStoreCode(storeCode?: string) {
  const normalized = (storeCode || '').trim().toUpperCase();
  if (normalized.endsWith('-NSA') || normalized.endsWith('-SAU') || normalized.endsWith('-SA')) return 'SA';
  if (normalized.endsWith('-NAE') || normalized.endsWith('-UAE') || normalized.endsWith('-AE')) return 'AE';
  if (normalized.endsWith('-NEG') || normalized.endsWith('-EG')) return 'EG';
  return '';
}

export function productKeywordSiteCodeFromScope(scope: {
  storeCode?: string;
  siteLabels?: readonly (string | null | undefined)[];
}) {
  return (
    siteCodeFromStoreCode(scope.storeCode) ||
    scope.siteLabels?.find((site) => SITE_LABEL_PATTERN.test(site || '')) ||
    ''
  );
}
