import { prettifyError, z } from 'zod';
import type { KindDefinitions } from '@louter/core/types';
import type { LouterStage } from '@louter/core/LouterStage';
import type { LouterContext } from '@louter/core/LouterContext';
import { LouterWarningType } from '@louter/core/LouterWarningType';
import { LOUTER_REFERENCE_MARKER, LOUTER_SEPARATOR } from '@louter/core/references';

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
      ctx.content[object.kind][id] = zodResult.data as z.output<Kinds[string]>;
    });
  }

  /**
   * Add an error to the context if the reference can not be found
   * @param ctx
   * @param reference
   * @private
   */
  private validateReference<Kinds extends KindDefinitions>(ctx: LouterContext<Kinds>, reference: string): string {
    if (!reference.startsWith(LOUTER_REFERENCE_MARKER)) {
      return reference;
    }

    const [, kind, ...rest] = reference.split(LOUTER_SEPARATOR);
    const refId = rest.join(LOUTER_SEPARATOR);

    if (!ctx.content[kind]) {
      ctx.warnings.push({
        type: LouterWarningType.MissingReferenceKind,
        message: `Missing reference kind '${kind}'`,
        path: 'TODO',
      });

      return refId;
    }

    if (!ctx.content[kind][refId]) {
      ctx.warnings.push({
        type: LouterWarningType.MissingReference,
        message: `Missing reference '${reference}'`,
        path: 'TODO',
      });

      return refId;
    }

    return refId;
  }

  private validateRecursive<Kinds extends KindDefinitions>(ctx: LouterContext<Kinds>, value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((entry) => this.validateRecursive(ctx, entry));
    }

    if (value && typeof value === 'object') {
      const result: Record<string, unknown> = {};

      for (const [key, val] of Object.entries(value)) {
        const newKey = this.validateReference(ctx, key);
        result[newKey] = this.validateRecursive(ctx, val);
      }

      return result;
    }

    if (typeof value === 'string') {
      return this.validateReference(ctx, value);
    }

    return value;
  }

  /**
   * Recursively validate all objects and replace reference markers
   * @param ctx
   */
  validateReferences<Kinds extends KindDefinitions>(ctx: LouterContext<Kinds>): void {
    Object.entries(ctx.content).forEach(([kind, items]) => {
      Object.entries(items).forEach(([id, item]) => {
        ctx.content[kind][id] = this.validateRecursive(ctx, item) as z.output<Kinds[string]>;
      });
    });
  }
}
