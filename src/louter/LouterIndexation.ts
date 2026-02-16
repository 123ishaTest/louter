export interface LouterIndexation {
  id: string;
  kind: string;
  source: string;
}

export type LouterIndexationMap = Record<string, Record<string, LouterIndexation>>;

export interface LouterIndexationResult {
  enumCode: string;
  content: LouterIndexationMap;
}
