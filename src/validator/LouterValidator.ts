import { prettifyError } from 'zod';
import type { KindDefinitions } from '@louter/core/types';
import type { LouterStage } from '@louter/core/LouterStage';
import type { LouterContext } from '@louter/core/LouterContext';
import { LouterWarningType } from '@louter/core/LouterWarningType';
import { flattenObject } from 'es-toolkit';
import { LOUTER_REFERENCE_PREFIX, LOUTER_SEPARATOR } from '@louter/core/references';

/**
 * Validate all LouterObjects through their Zod schemas
 */
export class LouterValidator implements LouterStage {
  run<Kinds extends KindDefinitions>(ctx: LouterContext<Kinds>): void {
    this.parse(ctx);
    this.validateReferences(ctx);
  }

  parse<Kinds extends KindDefinitions>(ctx: LouterContext<Kinds>): void {
    ctx.objects.forEach((object) => {
      const schema = ctx.kinds[object.kind];
      if (!schema) {
        ctx.warnings.push({
          path: object.path,
          type: LouterWarningType.InvalidKind,
          message: `Invalid content kind '${object.kind}'`,
        });
        return;
      }

      const id = object.data['id'] as string | undefined;
      if (!id) {
        ctx.warnings.push({
          path: object.path,
          type: LouterWarningType.MissingGlobalIdKey,
          message: `Content does not have the global idKey 'id'`,
        });
        return;
      }

      const zodResult = schema.safeParse(object.data);
      if (!zodResult.success) {
        ctx.warnings.push({
          path: object.path,
          type: LouterWarningType.ZodParsingFailed,
          message: prettifyError(zodResult.error).toString(),
        });
        return;
      }

      if (ctx.content[object.kind]?.[id]) {
        ctx.warnings.push({
          path: object.path,
          type: LouterWarningType.DuplicateId,
          message: `Duplicate id '${id}'`,
        });
        return;
      }
      // TODO(@Isha): Fix?
      // @ts-expect-error Fix map already existing
      ctx.content[object.kind][id] = zodResult.data;
    });
  }

  validateReferences<Kinds extends KindDefinitions>(ctx: LouterContext<Kinds>): void {
    Object.values(ctx.content).forEach((items) => {
      Object.values(items).forEach((item) => {
        const flat = flattenObject(item as object);

        Object.entries(flat).forEach(([key, value]) => {
          if (value.toString().startsWith(LOUTER_REFERENCE_PREFIX)) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [_, kind, ...rest] = value.split(LOUTER_SEPARATOR);
            const refId = rest.join(LOUTER_SEPARATOR);

            if (!ctx.content[kind]) {
              ctx.warnings.push({
                type: LouterWarningType.MissingReferenceKind,
                message: `Missing reference kind '${kind}'`,
                path: key,
              });
              return;
            }

            if (!ctx.content[kind][refId]) {
              ctx.warnings.push({
                type: LouterWarningType.MissingReference,
                message: `Missing reference '${value}'`,
                path: key,
              });
              return;
            }
          }
        });
      });
    });
  }
}
