export type ApiResponseDecoder<T> = (payload: unknown) => T

export class ApiResponseDecodeError extends Error {
  readonly path: string
  readonly expected: string

  constructor(path: string, expected: string) {
    super(`后端响应字段 ${path} 应为${expected}`)
    this.name = 'ApiResponseDecodeError'
    this.path = path
    this.expected = expected
  }
}

export function responseFieldPath(parentPath: string, field: string) {
  return `${parentPath}.${field}`
}

export function responseRecord(value: unknown, path = '$'): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiResponseDecodeError(path, '对象')
  }
  return value as Record<string, unknown>
}

export function responseArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new ApiResponseDecodeError(path, '数组')
  }
  return value
}

export function requiredResponseString(record: Record<string, unknown>, field: string, path: string) {
  const value = record[field]
  if (typeof value !== 'string') {
    throw new ApiResponseDecodeError(responseFieldPath(path, field), '字符串')
  }
  return value
}

export function requiredResponseBoolean(record: Record<string, unknown>, field: string, path: string) {
  const value = record[field]
  if (typeof value !== 'boolean') {
    throw new ApiResponseDecodeError(responseFieldPath(path, field), '布尔值')
  }
  return value
}

export function requiredResponseNumber(record: Record<string, unknown>, field: string, path: string) {
  const value = record[field]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ApiResponseDecodeError(responseFieldPath(path, field), '有限数字')
  }
  return value
}

export function optionalResponseArray(record: Record<string, unknown>, field: string, path: string) {
  const value = record[field]
  return value == null ? undefined : responseArray(value, responseFieldPath(path, field))
}

export function optionalResponseRecord(record: Record<string, unknown>, field: string, path: string) {
  const value = record[field]
  return value == null ? undefined : responseRecord(value, responseFieldPath(path, field))
}

export function assertOptionalResponseStrings(
  record: Record<string, unknown>,
  fields: readonly string[],
  path: string
) {
  fields.forEach((field) => {
    const value = record[field]
    if (value != null && typeof value !== 'string') {
      throw new ApiResponseDecodeError(responseFieldPath(path, field), '字符串或空值')
    }
  })
}

export function assertOptionalResponseNumbers(
  record: Record<string, unknown>,
  fields: readonly string[],
  path: string
) {
  fields.forEach((field) => {
    const value = record[field]
    if (value != null && (typeof value !== 'number' || !Number.isFinite(value))) {
      throw new ApiResponseDecodeError(responseFieldPath(path, field), '有限数字或空值')
    }
  })
}

export function assertResponseStringUnion(
  record: Record<string, unknown>,
  field: string,
  allowedValues: readonly string[],
  path: string
) {
  const value = requiredResponseString(record, field, path)
  if (!allowedValues.includes(value)) {
    throw new ApiResponseDecodeError(
      responseFieldPath(path, field),
      allowedValues.map((item) => `"${item}"`).join(' 或 ')
    )
  }
  return value
}
