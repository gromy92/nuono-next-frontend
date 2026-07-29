export function listFieldTags(value: unknown) {
  let source = value
  if (typeof source === 'string') {
    const serialized = source
    try {
      source = JSON.parse(serialized)
    } catch {
      source = serialized.trim() ? [serialized.trim()] : []
    }
  }
  const values: string[] = []
  const collect = (item: unknown) => {
    if (typeof item === 'string' || typeof item === 'number') {
      const text = String(item).trim()
      if (text) values.push(text)
      return
    }
    if (Array.isArray(item)) {
      item.forEach(collect)
      return
    }
    if (!item || typeof item !== 'object') return
    const row = item as Record<string, unknown>
    const label = row.label ?? row.text ?? row.name ?? row.title
    if (typeof label === 'string' || typeof label === 'number') {
      collect(label)
      return
    }
    Object.values(row).forEach(collect)
  }
  collect(source)
  return Array.from(new Set(values)).slice(0, 8)
}
