import { expect, it } from 'vitest';
import z from 'zod';
import { createContext } from '@louter/core/util';
import { LouterValidator } from '@louter/validator/LouterValidator';
import { LouterWarningType } from '@louter/core/LouterWarningType';
import { ref } from '@louter/core/references';

it('resolves references', () => {
  // Arrange
  const parser = new LouterValidator();
  const ctx = createContext({
    first: z.strictObject({
      id: z.string(),
    }),
    second: z.strictObject({
      id: z.string(),
      first: ref('first'),
    }),
  });
  const firstPiece = { id: 'a' };
  const secondPiece = { id: 'b', first: 'a' };
  ctx.content.first = {
    a: firstPiece,
  };
  ctx.content.second = {
    b: secondPiece,
  };

  // Act
  parser.run(ctx);

  // Assert
  expect(ctx.warnings).toStrictEqual([]);
  expect(ctx.content.first.a).toStrictEqual(firstPiece);
  expect(ctx.content.second.b).toStrictEqual(secondPiece);
});

it('fails on incorrect kinds', () => {
  // Arrange
  const validator = new LouterValidator();
  const ctx = createContext({
    example: z.strictObject({
      id: z.string(),
      relation: ref('wrong'),
    }),
  });
  ctx.objects = [{ path: 'a.example.json', kind: 'example', data: { id: 'a', relation: 'wrong-id' } }];

  // Act
  validator.run(ctx);

  // Assert
  expect(ctx.warnings).toHaveLength(1);
  expect(ctx.warnings[0].type).toBe(LouterWarningType.MissingReferenceKind);
});

it('fails on incorrect references', () => {
  // Arrange
  const validator = new LouterValidator();
  const ctx = createContext({
    first: z.strictObject({
      id: z.string(),
    }),
    second: z.strictObject({
      id: z.string(),
      first: ref('first'),
    }),
  });
  ctx.objects = [
    { path: 'a.first.json', kind: 'first', data: { id: 'a' } },
    { path: 'b.second.json', kind: 'second', data: { id: 'b', first: 'wrong' } },
  ];

  // Act
  validator.run(ctx);

  // Assert
  expect(ctx.warnings).toHaveLength(1);
  expect(ctx.warnings[0].type).toBe(LouterWarningType.MissingReference);
});

it("doesn't break when using special characters", () => {
  // Arrange
  const validator = new LouterValidator();
  const ctx = createContext({
    first: z.strictObject({
      id: z.string(),
    }),
    second: z.strictObject({
      id: z.string(),
      first: ref('first'),
    }),
  });
  ctx.objects = [
    { path: 'a.first.json', kind: 'first', data: { id: 'a:detail' } },
    { path: 'b.second.json', kind: 'second', data: { id: 'b', first: 'a:detail' } },
  ];

  // Act
  validator.run(ctx);

  // Assert
  expect(ctx.warnings).toHaveLength(0);
});

it('can reference itself', () => {
  // Arrange
  const validator = new LouterValidator();
  const ctx = createContext({
    item: z.strictObject({
      id: z.string(),
      meta: ref('item'),
    }),
  });
  ctx.objects = [{ path: 'a.item.json', kind: 'item', data: { id: 'a', meta: 'a' } }];

  // Act
  validator.run(ctx);

  // Assert
  expect(ctx.warnings).toStrictEqual([]);
});
