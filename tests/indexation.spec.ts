import { expect, it } from 'vitest';
import path from 'node:path';
import { Louter } from '@/louter/Louter.ts';
import { CurrencySchema } from '@/example/CurrencySchema.ts';
import { ItemSchema } from '@/example/ItemSchema.ts';

it('Indexes an schemas', () => {
  // Arrange
  const louter = new Louter({
    idKey: 'id',
    root: path.dirname(__dirname) + '/tests/data',
    debug: true,
    content: [
      { id: 'currency', schema: CurrencySchema, enumSymbol: 'CurrencyId' },
      { id: 'item', schema: ItemSchema, enumSymbol: 'ItemId' },
    ],
  });

  // Act
  const indexation = louter.index();

  console.log(indexation);

  // Assert
  expect(Object.values(indexation.content)).toHaveLength(0);
});
