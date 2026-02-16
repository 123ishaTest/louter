import z from 'zod';

export const CurrencySchema = z.strictObject({
  id: z.string(),
  name: z.string(),
});
