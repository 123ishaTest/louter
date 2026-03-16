import { LouterContext } from '@louter/core/LouterContext';
import { LouterStage } from '@louter/core/LouterStage';
import { LouterWarningType } from '@louter/core/LouterWarningType';
import { KindDefinitions } from '@louter/core/types';
import { isJsonSchemaEntry, isObject } from '@louter/util/type';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export class LouterVsCodeSettingsWriter implements LouterStage {
  private readonly _settingsPath: string;

  constructor(settingsPath: string = '.vscode/settings.json') {
    this._settingsPath = settingsPath;
  }

  run<Kinds extends KindDefinitions>(ctx: LouterContext<Kinds>) {
    let settings: Record<string, unknown> = {};

    try {
      settings = JSON.parse(readFileSync(this._settingsPath, 'utf-8'));
    } catch {
      // If the settings file is missing or invalid JSON, settings will be an empty object.
      ctx.warnings.push({
        type: LouterWarningType.InvalidJson,
        path: this._settingsPath,
        message: `Could not read or parse ${this._settingsPath}. A new settings file will be created.`,
      });
    }

    const yamlSchemas: Record<string, string[]> = {};
    const jsonSchemas: Array<{ fileMatch: string[]; url: string }> = [];

    Object.keys(ctx.kinds).forEach((kind) => {
      yamlSchemas[`.generated/${kind}.schema.json`] = [`**/*.${kind}.y[a]ml`];
      jsonSchemas.push({
        fileMatch: [`**/*.${kind}.json`],
        url: `.generated/${kind}.schema.json`,
      });
    });

    const currentYamlSchemas = isObject(settings['yaml.schemas']) ? settings['yaml.schemas'] : {};
    settings['yaml.schemas'] = {
      ...currentYamlSchemas,
      ...yamlSchemas,
    };

    const currentJsonSchemas = Array.isArray(settings['json.schemas'])
      ? settings['json.schemas'].filter(isJsonSchemaEntry)
      : [];

    const generatedByUrl = new Map(jsonSchemas.map((schema) => [schema.url, schema]));
    const mergedJsonSchemas = currentJsonSchemas.filter((schema) => !generatedByUrl.has(schema.url));
    settings['json.schemas'] = [...mergedJsonSchemas, ...jsonSchemas];

    const settingsDir = path.dirname(this._settingsPath);
    mkdirSync(settingsDir, { recursive: true });

    writeFileSync(this._settingsPath, `${JSON.stringify(settings, null, 2)}\n`, 'utf-8');
  }
}
