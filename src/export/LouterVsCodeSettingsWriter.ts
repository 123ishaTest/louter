import { LouterContext } from '@louter/core/LouterContext';
import { LouterStage } from '@louter/core/LouterStage';
import { KindDefinitions } from '@louter/core/types';
import { readFileSync, writeFileSync } from 'node:fs';

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isJsonSchemaEntry(value: unknown): value is { fileMatch: string[]; url: string } {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.url === 'string' &&
    Array.isArray(value.fileMatch) &&
    value.fileMatch.every((match) => typeof match === 'string')
  );
}

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
      // If the settings file is missing or invalid JSON, rebuild from scratch.
      settings = {};
    }

    const yamlSchemas: Record<string, string[]> = {};
    const jsonSchemas: Array<{ fileMatch: string[]; url: string }> = [];

    Object.keys(ctx.kinds).forEach((kind) => {
      yamlSchemas[`.generated/${kind}.schema.json`] = [`**/*.${kind}.yaml`];
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

    writeFileSync(this._settingsPath, `${JSON.stringify(settings, null, '\t')}\n`, 'utf-8');
  }
}
