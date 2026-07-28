export function formatProductValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatProductValue(item)).join(' / ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export function productTextInputValue(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}
