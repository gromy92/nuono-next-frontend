import assert from 'node:assert/strict'
import {
  targetLanguageMismatchMessage,
  translatedTextMatchesTargetLang
} from './ProductContentTranslationEditor.helpers'

assert.equal(translatedTextMatchesTargetLang('手机保护壳', 'ZH'), true)
assert.equal(translatedTextMatchesTargetLang('جراب مغناطيسي', 'ZH'), false)
assert.equal(translatedTextMatchesTargetLang('Magnetic case', 'ZH'), false)

assert.equal(translatedTextMatchesTargetLang('جراب مغناطيسي لهاتف iPhone 17', 'AR'), true)
assert.equal(translatedTextMatchesTargetLang('Magnetic case for iPhone 17', 'AR'), false)
assert.equal(translatedTextMatchesTargetLang('手机保护壳', 'AR'), false)

assert.equal(translatedTextMatchesTargetLang('Magnetic case for iPhone 17', 'EN'), true)
assert.equal(translatedTextMatchesTargetLang('جراب Magnetic case', 'EN'), false)
assert.equal(translatedTextMatchesTargetLang('磁吸保护壳', 'EN'), false)

assert.equal(targetLanguageMismatchMessage('ZH'), 'AI 返回的翻译不是中文，请重试。')
assert.equal(targetLanguageMismatchMessage('EN'), 'AI 返回的翻译不是英文，请重试。')
assert.equal(targetLanguageMismatchMessage('AR'), 'AI 返回的翻译不是阿语，请重试。')
