import { beforeEach, expect, it, vi } from 'vitest';
import { fs, vol } from 'memfs';
import { createContext } from '@louter/core/util';
import { LouterVsCodeSettingsWriter } from '@louter/export/LouterVsCodeSettingsWriter';
import z from 'zod';

// Mock fs everywhere else with the memfs version.
vi.mock('node:fs', () => ({ default: fs, ...fs }));

beforeEach(() => {
  // reset the state of in-memory fs
  vol.reset();
});

it('writes yaml and json schema mappings to vscode settings', () => {
  // Arrange
  fs.mkdirSync('.vscode', { recursive: true });

  const writer = new LouterVsCodeSettingsWriter();
  const ctx = createContext({
    example: z.strictObject({ id: z.string() }),
    other: z.strictObject({ id: z.string(), value: z.number() }),
  });

  // Act
  writer.run(ctx);

  // Assert
  const result = fs.readFileSync('.vscode/settings.json', 'utf-8').toString();
  expect(JSON.parse(result)).toStrictEqual({
    'yaml.schemas': {
      '.generated/example.schema.json': ['**/*.example.yaml'],
      '.generated/other.schema.json': ['**/*.other.yaml'],
    },
    'json.schemas': [
      {
        fileMatch: ['**/*.example.json'],
        url: '.generated/example.schema.json',
      },
      {
        fileMatch: ['**/*.other.json'],
        url: '.generated/other.schema.json',
      },
    ],
  });
});

it('merges schema mappings with existing vscode settings when schema keys are missing', () => {
  // Arrange
  fs.mkdirSync('.vscode', { recursive: true });
  fs.writeFileSync(
    '.vscode/settings.json',
    JSON.stringify(
      {
        'editor.tabSize': 2,
        'files.trimTrailingWhitespace': true,
      },
      null,
      '\t',
    ),
  );

  const writer = new LouterVsCodeSettingsWriter();
  const ctx = createContext({
    example: z.strictObject({ id: z.string() }),
  });

  // Act
  writer.run(ctx);

  // Assert
  const result = fs.readFileSync('.vscode/settings.json', 'utf-8').toString();
  expect(JSON.parse(result)).toStrictEqual({
    'editor.tabSize': 2,
    'files.trimTrailingWhitespace': true,
    'yaml.schemas': {
      '.generated/example.schema.json': ['**/*.example.yaml'],
    },
    'json.schemas': [
      {
        fileMatch: ['**/*.example.json'],
        url: '.generated/example.schema.json',
      },
    ],
  });
});

it('merges schema mappings with existing yaml.schemas and json.schemas', () => {
  // Arrange
  fs.mkdirSync('.vscode', { recursive: true });
  fs.writeFileSync(
    '.vscode/settings.json',
    JSON.stringify(
      {
        'yaml.schemas': {
          '.generated/legacy.schema.json': ['**/*.legacy.yaml'],
        },
        'json.schemas': [
          {
            fileMatch: ['**/*.legacy.json'],
            url: '.generated/legacy.schema.json',
          },
        ],
      },
      null,
      '\t',
    ),
  );

  const writer = new LouterVsCodeSettingsWriter();
  const ctx = createContext({
    example: z.strictObject({ id: z.string() }),
  });

  // Act
  writer.run(ctx);

  // Assert
  const result = fs.readFileSync('.vscode/settings.json', 'utf-8').toString();
  expect(JSON.parse(result)).toStrictEqual({
    'yaml.schemas': {
      '.generated/legacy.schema.json': ['**/*.legacy.yaml'],
      '.generated/example.schema.json': ['**/*.example.yaml'],
    },
    'json.schemas': [
      {
        fileMatch: ['**/*.legacy.json'],
        url: '.generated/legacy.schema.json',
      },
      {
        fileMatch: ['**/*.example.json'],
        url: '.generated/example.schema.json',
      },
    ],
  });
});
