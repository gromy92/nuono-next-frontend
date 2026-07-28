const ALLOWED_RICH_TEXT_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'div',
  'em',
  'font',
  'h2',
  'h3',
  'i',
  'li',
  'ol',
  'p',
  's',
  'span',
  'strike',
  'strong',
  'u',
  'ul'
]);
const DROP_WITH_CONTENT_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math']);
const SAFE_COLOR_PATTERN = /^(#[0-9a-f]{3,8}|rgba?\([0-9\s.,%]+\)|[a-z]+)$/i;
const SAFE_ALIGN_VALUES = new Set(['left', 'center', 'right', 'justify']);

function sanitizeRichTextStyle(styleValue: string) {
  const safeRules: string[] = [];
  styleValue.split(';').forEach((rule) => {
    const [rawProperty, ...rawValueParts] = rule.split(':');
    const property = rawProperty?.trim().toLowerCase();
    const value = rawValueParts.join(':').trim();
    if (!property || !value || /expression|url\(|javascript:|data:/i.test(value)) {
      return;
    }
    if ((property === 'color' || property === 'background-color') && SAFE_COLOR_PATTERN.test(value)) {
      safeRules.push(`${property}: ${value}`);
      return;
    }
    if (property === 'text-align' && SAFE_ALIGN_VALUES.has(value.toLowerCase())) {
      safeRules.push(`${property}: ${value.toLowerCase()}`);
    }
  });
  return safeRules.join('; ');
}

export function getSafeProductRichTextUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed || /[\u0000-\u001f]/.test(trimmed)) {
    return null;
  }
  try {
    const origin = typeof window === 'undefined' ? 'https://localhost' : window.location.origin;
    const url = new URL(trimmed, origin);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? trimmed : null;
  } catch {
    return null;
  }
}

function sanitizeRichTextNode(node: Node) {
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }
  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();
  if (DROP_WITH_CONTENT_TAGS.has(tagName)) {
    element.remove();
    return;
  }

  Array.from(element.childNodes).forEach(sanitizeRichTextNode);

  if (!ALLOWED_RICH_TEXT_TAGS.has(tagName)) {
    element.replaceWith(...Array.from(element.childNodes));
    return;
  }

  Array.from(element.attributes).forEach((attribute) => {
    const name = attribute.name.toLowerCase();
    const value = attribute.value;
    element.removeAttribute(attribute.name);

    if (name === 'style') {
      const safeStyle = sanitizeRichTextStyle(value);
      if (safeStyle) {
        element.setAttribute('style', safeStyle);
      }
      return;
    }
    if (name === 'align' && SAFE_ALIGN_VALUES.has(value.toLowerCase())) {
      element.setAttribute('style', `text-align: ${value.toLowerCase()}`);
      return;
    }
    if (tagName === 'a' && name === 'href') {
      const safeUrl = getSafeProductRichTextUrl(value);
      if (safeUrl) {
        element.setAttribute('href', safeUrl);
        element.setAttribute('rel', 'noopener noreferrer');
        element.setAttribute('target', '_blank');
      }
      return;
    }
    if (tagName === 'font' && name === 'color' && SAFE_COLOR_PATTERN.test(value.trim())) {
      element.setAttribute('style', `color: ${value.trim()}`);
    }
  });
}

export function sanitizeProductRichTextHtml(rawHtml: string) {
  if (typeof document === 'undefined') {
    return rawHtml;
  }
  const template = document.createElement('template');
  template.innerHTML = rawHtml;
  Array.from(template.content.childNodes).forEach(sanitizeRichTextNode);
  return template.innerHTML;
}

export function normalizeProductRichTextHtml(value: unknown) {
  return sanitizeProductRichTextHtml(String(value ?? ''));
}
