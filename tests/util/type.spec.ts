import { expect, it } from 'vitest';
import { isJsonSchemaEntry } from '@louter/util/type';

it('Calculates json schema entries', () => {
  // Arrange
  const schema = {
    fileMatch: ['**/*.example.json'],
    url: '.generated/example.schema.json',
  };

  // Act
  const result = isJsonSchemaEntry(schema);

  // Assert
  expect(result).toBe(true);
});

it("Doesn't fall for not schemas", () => {
  // Arrange
  const notSchema = 3;

  // Act
  const result = isJsonSchemaEntry(notSchema);

  // Assert
  expect(result).toBe(false);
});
