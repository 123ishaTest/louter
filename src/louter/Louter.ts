import { glob } from 'glob';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { generateEnumType } from '@/generate/string-type.ts';
import { LouterKind } from '@/louter/LouterKind.ts';
import { LouterIndexationMap, LouterIndexationResult } from '@/louter/LouterIndexation.ts';
import { LouterErrorType } from '@/louter/LouterError.ts';

export interface LouterConfig {
  root: string;
  content: LouterKind[];
  debug: boolean;
  idKey: string;
}

export class Louter {
  private readonly _config: LouterConfig;

  // private _content: Record<string, Record<string, object>> = {};

  constructor(config: LouterConfig) {
    this._config = config;
  }

  public index(): LouterIndexationResult {
    const indexationMap: LouterIndexationMap = {};
    const errors = [];

    const filePaths = glob.sync(`${this._config.root}/**/*.{yml,yaml}`);
    this.debug(`Reading ${filePaths.length} files from`, this._config.root);

    console.log(filePaths);
    filePaths.forEach((filePath) => {
      const kind = filePath.replace('.yaml', '').replace('.yml', '').split('.').pop() as string;
      const fileName = filePath.replace(this._config.root, '');

      indexationMap[kind] ??= {};

      try {
        const parsedData = parse(readFileSync(filePath, 'utf8'));
        const contentId = parsedData[this._config.idKey];
        indexationMap[kind][contentId] = {
          id: contentId,
          kind: kind,
          source: fileName,
        };
      } catch (e) {
        errors.push({
          file: filePath,
          type: LouterErrorType.InvalidYaml,
          message: `Could not parse file '${fileName}'. Is it valid yaml?: ${e}`,
        });
      }
    });

    return {
      content: indexationMap,
      enumCode: this.buildKindEnum(indexationMap),
    };
  }

  private buildKindEnum(result: LouterIndexationMap): string {
    let output = "import { z } from 'zod';\n\n";

    this._config.content.forEach((kind) => {
      output += generateEnumType(
        kind.enumSymbol,
        Object.values(result[kind.id] ?? []).map((result) => result.id),
      );
    });
    return output;
  }

  private debug(...args: unknown[]) {
    if (this._config.debug) {
      console.log(...args);
    }
  }
}
