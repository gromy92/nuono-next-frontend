import { ApiError, parseApiResponse } from './api'

async function main() {
  const structuredResponse = new Response(
    JSON.stringify({
      code: 'NOON_PBARCODE_UNMAPPED',
      message: 'Noon 已创建 ASN A05726515PN，但商品行未创建成功，请勿重复创建。',
      category: 'BUSINESS_VALIDATION',
      operation: 'CREATE_ASN_LINES',
      retryable: false,
      partialSuccess: true,
      reference: 'A05726515PN',
      details: { affectedPskuCodes: ['afbb2138c32bb212a0eab446b986b2aa'] }
    }),
    { status: 422, headers: { 'Content-Type': 'application/json' } }
  )

  try {
    await parseApiResponse(structuredResponse, 'fallback')
    throw new Error('structured response should fail')
  } catch (error) {
    if (!(error instanceof ApiError)) {
      throw new Error('structured API response must throw ApiError')
    }
    if (error.status !== 422 || error.problem?.code !== 'NOON_PBARCODE_UNMAPPED') {
      throw new Error('structured problem facts were not preserved')
    }
    if (!error.problem.partialSuccess || error.problem.retryable !== false) {
      throw new Error('partial-success and retry semantics were not preserved')
    }
    if (error.problem.reference !== 'A05726515PN') {
      throw new Error('business reference was not preserved')
    }
  }

  const legacyResponse = new Response(JSON.stringify({ message: 'legacy message' }), {
    status: 502,
    headers: { 'Content-Type': 'application/json' }
  })
  try {
    await parseApiResponse(legacyResponse, 'fallback')
    throw new Error('legacy response should fail')
  } catch (error) {
    if (!(error instanceof ApiError) || error.message !== 'legacy message' || error.problem) {
      throw new Error('legacy error fallback compatibility was not preserved')
    }
  }
}

void main()
