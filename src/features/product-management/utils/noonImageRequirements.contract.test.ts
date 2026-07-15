import assert from 'node:assert/strict'

const requirements = await import('./noonImageRequirements').catch(() => null)

assert(requirements, 'expected Noon image requirement utilities to exist')

const {
  evaluateNoonImageDimensions,
  normalizeNoonImageAssetMetadata,
  selectNoonImageAdaptTarget
} = requirements as typeof import('./noonImageRequirements')

assert.deepEqual(
  selectNoonImageAdaptTarget({ width: 660, height: 904 }),
  { width: 660, height: 904, sourceTooSmall: false },
  '660-899px source images should adapt to the minimum Noon canvas'
)

assert.deepEqual(
  selectNoonImageAdaptTarget({ width: 1000, height: 1370 }),
  { width: 1247, height: 1706, sourceTooSmall: false },
  'wide source images should adapt to the full Noon-ready canvas'
)

assert.deepEqual(
  selectNoonImageAdaptTarget({ width: 500, height: 685 }),
  { width: 660, height: 904, sourceTooSmall: true },
  'source images below Noon minimum width should only be upscaled to minimum canvas and remain flagged'
)

assert.equal(evaluateNoonImageDimensions({ width: 660, height: 904 }).status, 'ready')
assert.equal(evaluateNoonImageDimensions({ width: 640, height: 904 }).status, 'blocked')
assert.equal(evaluateNoonImageDimensions({ width: 660, height: 760 }).code, 'aspect_ratio_mismatch')

assert.deepEqual(
  normalizeNoonImageAssetMetadata(
    ['https://example.test/main.jpg', 'https://example.test/detail.jpg'],
    [
      { imageUrl: 'https://example.test/main.jpg', width: 1247, height: 1706 },
      { imageUrl: 'https://example.test/unused.jpg', width: 1247, height: 1706 }
    ]
  ),
  [
    {
      imageUrl: 'https://example.test/main.jpg',
      width: 1247,
      height: 1706,
      aspectRatio: 0.73,
      noonReady: true,
      sourceTooSmall: false
    }
  ],
  'metadata saved with draft should only include active images and normalized Noon readiness fields'
)
