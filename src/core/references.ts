import { z } from 'zod';

export const LOUTER_REFERENCE_PREFIX = '$ref';
export const LOUTER_SEPARATOR = ':';

export function ref(kind: string) {
  return z.string().transform((v) => `${LOUTER_REFERENCE_PREFIX}${LOUTER_SEPARATOR}${kind}${LOUTER_SEPARATOR}${v}`);
}
