import z from 'zod';

export const ItemSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});
