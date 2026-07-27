import assert from 'node:assert/strict'
import { summarizeImageStatus } from './profileSummaryStatus'

assert.equal(summarizeImageStatus([]), 'NOT_REQUESTED')
assert.equal(summarizeImageStatus(['DRAFT']), 'CANDIDATE')
assert.equal(summarizeImageStatus(['ONLINE', 'GENERATING']), 'GENERATING')
assert.equal(summarizeImageStatus(['ONLINE', 'PENDING_REVIEW']), 'PENDING_CONFIRMATION')
assert.equal(summarizeImageStatus(['ONLINE', 'FAILED']), 'ACTION_REQUIRED')
assert.equal(summarizeImageStatus(['HISTORICAL', 'DISCARDED']), 'NOT_REQUESTED')
assert.equal(
  summarizeImageStatus(['HISTORICAL', 'ONLINE', 'PUBLISHING', 'FAILED']),
  'ACTION_REQUIRED',
  'the PSKU summary must expose the highest-priority actionable status across active suites'
)
