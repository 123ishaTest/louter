import type { ZodType } from 'zod';

export interface LouterKind {
  id: string;
  enumSymbol: string;
  schema: ZodType;
}
