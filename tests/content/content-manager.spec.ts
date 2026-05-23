import { expect, it } from 'vitest';
import { ContentManager } from '@louter/content/ContentManager';
import z from 'zod';
import { ContentKindNotFoundError, ContentNotFoundError } from '@louter/core/LouterError';

it('can load content', () => {
  // Arrange
  const exampleA = { id: 'a', amount: 4 };
  const exampleB = { id: 'b', amount: 4 };
  const exampleContent = { a: exampleA, b: exampleB };

  const manager = new ContentManager({
    example: z.strictObject({
      id: z.string(),
      amount: z.number(),
    }),
  });

  // Act
  manager.load({
    example: exampleContent,
  });
  const content = manager.getMap('example');

  // Assert
  expect(content).toStrictEqual(exampleContent);
});

it('can get individual pieces of content', () => {
  // Arrange
  const exampleA = { id: 'a', amount: 4 };

  const manager = new ContentManager({
    example: z.strictObject({
      id: z.string(),
      amount: z.number(),
    }),
  });

  // Act
  manager.loadKind('example', [exampleA]);
  const content = manager.get(exampleA.id, 'example');

  // Assert
  expect(content).toStrictEqual(exampleA);
});

it('throws an error when a kind does not exist', () => {
  // Arrange
  const manager = new ContentManager({});

  // Act
  expect(() => {
    // @ts-expect-error wrong kind
    manager.getMap('wrong');
  }).toThrow(ContentKindNotFoundError);

  expect(() => {
    // @ts-expect-error wrong kind
    manager.getList('wrong');
  }).toThrow(ContentKindNotFoundError);
});

it('throws an error when a piece of content does not exist', () => {
  // Arrange
  const manager = new ContentManager({
    example: z.strictObject({
      id: z.string(),
      amount: z.number(),
    }),
  });

  // Act
  expect(() => {
    manager.get('wrong', 'example');
  }).toThrow(ContentNotFoundError);
});

it('can get schemas', () => {
  // Arrange
  const exampleSchema = z.strictObject({
    id: z.string(),
    amount: z.number(),
  });
  const manager = new ContentManager({
    example: exampleSchema,
  });

  // Act
  const schema = manager.getSchema('example');

  // Assert
  expect(schema).toBe(exampleSchema);
});

it('throws an error when a schema does not exist', () => {
  // Arrange
  const manager = new ContentManager({
    example: z.strictObject({
      id: z.string(),
      amount: z.number(),
    }),
  });

  // Act
  expect(() => {
    // @ts-expect-error wrong kind
    manager.getSchema('wrong');
  }).toThrow(ContentKindNotFoundError);
});

it('can get a list of all kinds', () => {
  // Arrange
  const manager = new ContentManager({
    example: z.strictObject({
      id: z.string(),
      amount: z.number(),
    }),
    other: z.strictObject({
      id: z.string(),
    }),
  });

  // Act
  const kinds = manager.getKinds();

  // Assert
  expect(kinds).toStrictEqual(['example', 'other']);
});

it('can get by id', () => {
  // Arrange
  const exampleA = { id: 'a', amount: 4 };
  const exampleB = { id: 'b', amount: 4 };
  const exampleContent = { a: exampleA, b: exampleB };

  const manager = new ContentManager({ example: z.strictObject({ id: z.string(), amount: z.number() }) });

  // Act
  manager.load({ example: exampleContent });

  // Act
  const content = manager.getById('b');

  // Assert
  expect(content).toStrictEqual(exampleB);
});

it('can get by id when there are multiple kinds', () => {
  // Arrange
  const exampleA = { id: 'a', amount: 4 };
  const exampleB = { id: 'b', amount: 4 };

  const manager = new ContentManager({
    first: z.strictObject({ id: z.string(), amount: z.number() }),
    second: z.strictObject({ id: z.string(), amount: z.number() }),
  });

  // Act
  manager.loadKind('first', [exampleA]);
  manager.loadKind('second', [exampleB]);

  // Act
  const contentA = manager.getById('a');
  const contentB = manager.getById('b');

  // Assert
  expect(contentA).toStrictEqual(exampleA);
  expect(contentB).toStrictEqual(exampleB);
});

it('throws an error when it cannot find by id', () => {
  // Arrange
  const manager = new ContentManager({
    example: z.strictObject({
      id: z.string(),
      amount: z.number(),
    }),
  });
  manager.load({ example: { b: { id: 'b', amount: 4 } } });

  // Act
  expect(() => {
    manager.getById('a');
  }).toThrow(ContentNotFoundError);
});
