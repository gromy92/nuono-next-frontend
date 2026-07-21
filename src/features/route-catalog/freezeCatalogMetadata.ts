export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T

export function freezeCatalogMetadata<T>(value: T): DeepReadonly<T> {
  if (Array.isArray(value)) {
    value.forEach(freezeCatalogMetadata)
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeCatalogMetadata)
  }
  return Object.freeze(value) as DeepReadonly<T>
}
