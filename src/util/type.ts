export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isJsonSchemaEntry(value: unknown): value is { fileMatch: string[]; url: string } {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.url === 'string' &&
    Array.isArray(value.fileMatch) &&
    value.fileMatch.every((match) => typeof match === 'string')
  );
}
