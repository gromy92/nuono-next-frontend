export function titleKeywordChineseTranslations(
  keywords: Array<{ key: string; label: string }>,
  translatedText?: string
) {
  const translatedLines = text(translatedText)
    .split(/\r?\n|[;；]+/u)
    .map(cleanTranslatedKeywordLine)
    .filter(Boolean);
  const nextTranslations: Record<string, string> = {};
  keywords.forEach((keyword, index) => {
    const translatedKeyword = translatedLines[index] || '';
    if (hasChineseText(translatedKeyword)) {
      nextTranslations[keyword.key] = translatedKeyword;
      return;
    }
    const fallback = arabicKeywordChineseFallback(keyword.label);
    if (fallback) {
      nextTranslations[keyword.key] = fallback;
    }
  });
  return nextTranslations;
}

export function hasChineseText(value?: string | null) {
  return /[\u4e00-\u9fff]/u.test(text(value));
}

function arabicKeywordChineseFallback(value: string) {
  const normalized = normalizeArabicKeyword(value);
  const dictionary: Record<string, string> = {
    'جراب': '保护壳',
    'مغناطيسي': '磁吸',
    'لهاتف': '手机',
    'ايفون': 'iPhone',
    'آيفون': 'iPhone',
    'متوافق': '兼容',
    'مقاوم': '防护',
    'للسقوط': '防摔',
    'ارتفاع': '高度',
    'صدمات': '防震',
    'للصدمات': '防震',
    'حلقي': '环形',
    'دوار': '旋转',
    'مسند': '支架',
    'اسود': '黑色',
    'أسود': '黑色'
  };
  return dictionary[normalized] || '';
}

function normalizeArabicKeyword(value: string) {
  return text(value)
    .replace(/[ًٌٍَُِّْـ]/gu, '')
    .replace(/[إأٱا]/gu, 'ا')
    .replace(/[ى]/gu, 'ي')
    .replace(/[ة]/gu, 'ه')
    .toLocaleLowerCase();
}

function cleanTranslatedKeywordLine(value: string) {
  const cleaned = text(value).replace(/^\s*[-*•\d.、)）]+/u, '').trim();
  const colonMatch = cleaned.match(/[:：]\s*(.+)$/u);
  if (colonMatch?.[1] && hasChineseText(colonMatch[1])) {
    return colonMatch[1].trim();
  }
  return cleaned;
}

function text(value?: string | null) {
  return (value || '').trim();
}
