import Z from 'zod';
import type { Ref, SupportedZodType, TypeDef } from './types';

export function serialise(schema: SupportedZodType): string {
  let refSeq = 0;
  const parentSchema = new Set<SupportedZodType>();
  const schemaRefs = new Map<SupportedZodType, { $ref: number }>();
  return JSON.stringify(transform(schema));


  function transform(schema: SupportedZodType): TypeDef | Ref {
    // return a ref if we have seen this schema
    let ref = schemaRefs.get(schema);
    if (!ref) {
      // init ref if seen for the first time
      ref = { $ref: 0 };
      schemaRefs.set(schema, ref);
    } else {
      // bump sequence if this schema is refed the first time
      if (ref.$ref === 0) {
        refSeq++;
        ref.$ref = refSeq;
      }
      return ref; // return a ref only if seen
    }

    parentSchema.add(schema); // remember the schema

    const { typeName, description, errorMap } = schema._def;
    const jsonTypeDef = {
      typeName: typeName,
      description: description,
      required_error: getCustomErrorMsg(errorMap),
      invalid_type_error: getCustomErrorMsg(errorMap, 1),
    } as TypeDef;

    switch (schema._def.typeName) {
      case Z.ZodFirstPartyTypeKind.ZodAny:
      case Z.ZodFirstPartyTypeKind.ZodVoid:
      case Z.ZodFirstPartyTypeKind.ZodNull:
      case Z.ZodFirstPartyTypeKind.ZodNever:
      case Z.ZodFirstPartyTypeKind.ZodUnknown:
      case Z.ZodFirstPartyTypeKind.ZodUndefined: {
        break;
      }
      case Z.ZodFirstPartyTypeKind.ZodNullable:
      case Z.ZodFirstPartyTypeKind.ZodOptional: {
        Object.assign(jsonTypeDef, {
          innerType: transform(schema._def.innerType)
        })
        break;
      }
      case Z.ZodFirstPartyTypeKind.ZodDefault: {
        Object.assign(jsonTypeDef, {
          innerType: transform(schema._def.innerType),
          defaultValue: schema._def.defaultValue()
        });
        break;
      }
      case Z.ZodFirstPartyTypeKind.ZodString: {
        Object.assign(jsonTypeDef, {
          coerce: schema._def.coerce || undefined,
          checks: schema._def.checks.map(c => c.kind !== 'regex' ? c : {
            kind: c.kind,
            message: c.message,
            regex: String(c.regex)
          }),
        });
        break;
      }
      case Z.ZodFirstPartyTypeKind.ZodNumber:
      case Z.ZodFirstPartyTypeKind.ZodDate: {
        Object.assign(jsonTypeDef, {
          checks: schema._def.checks,
          coerce: schema._def.coerce || undefined,
        });
        break;
      }
      case Z.ZodFirstPartyTypeKind.ZodNaN: {
        Object.assign(jsonTypeDef, {});
        break;
      }
      case Z.ZodFirstPartyTypeKind.ZodBigInt:
      case Z.ZodFirstPartyTypeKind.ZodBoolean: {
        Object.assign(jsonTypeDef, { coerce: schema._def.coerce || undefined });
        break;
      }
      case Z.ZodFirstPartyTypeKind.ZodArray: {
        Object.assign(jsonTypeDef, {
          minLength: schema._def.minLength || undefined,
          maxLength: schema._def.maxLength || undefined,
          exactLength: schema._def.exactLength || undefined,
          type: transform(schema._def.type),
        });
        break;
      }
      case Z.ZodFirstPartyTypeKind.ZodObject: {
        const _def = schema._def as Z.ZodObjectDef;
        Object.assign(jsonTypeDef, {
          shape: Object.fromEntries(Object.entries(_def.shape()).map(
            ([key, value]) => [key, transform(value)]
          )),
          unknownKeys: schema._def.unknownKeys,
          catchAll: transform(schema._def.catchall),
        });
        break;
      }
      case Z.ZodFirstPartyTypeKind.ZodUnion: {
        const _def = schema._def as Z.ZodUnionDef;
        Object.assign(jsonTypeDef, {
          options: _def.options.map(op => transform(op))
        });
        break;
      }
      case Z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion: {
        const _def = schema._def as Z.ZodDiscriminatedUnionDef<string>;
        Object.assign(jsonTypeDef, {
          discriminator: _def.discriminator,
          options: _def.options.map(op => transform(op)),
        });
        break;
      }
      case Z.ZodFirstPartyTypeKind.ZodIntersection: {
        const _def = schema._def as Z.ZodIntersectionDef;
        Object.assign(jsonTypeDef, {
          left: transform(_def.left),
          right: transform(_def.right),
        });
        break;
      }
      case Z.ZodFirstPartyTypeKind.ZodTuple: {
        const _def = schema._def as Z.ZodTupleDef;
        Object.assign(jsonTypeDef, {
          items: _def.items.map(i => transform(i)),
          rest: _def.rest ? transform(_def.rest) : undefined,
        });
        break;
      }
      case Z.ZodFirstPartyTypeKind.ZodRecord: {
        const _def = schema._def as Z.ZodRecordDef;
        Object.assign(jsonTypeDef, {
          keyType: transform(_def.keyType),
          valueType: transform(_def.valueType),
        });
        break;
      }
      case Z.ZodFirstPartyTypeKind.ZodMap: {
        const _def = schema._def as Z.ZodMapDef;
        Object.assign(jsonTypeDef, {
          keyType: transform(_def.keyType),
          valueType: transform(_def.valueType),
        });
        break;
      }
      case Z.ZodFirstPartyTypeKind.ZodSet: {
        const _def = schema._def as Z.ZodSetDef;
        Object.assign(jsonTypeDef, {
          valueType: transform(_def.valueType),
          minSize: _def.minSize || undefined,
          maxSize: _def.maxSize || undefined,
        });
        break;
      }
      case Z.ZodFirstPartyTypeKind.ZodLiteral: {
        Object.assign(jsonTypeDef, { value: schema._def.value });
        break;
      }
      case Z.ZodFirstPartyTypeKind.ZodEnum:
      case Z.ZodFirstPartyTypeKind.ZodNativeEnum: {
        Object.assign(jsonTypeDef, { values: schema._def.values });
        break;
      }
      default: {
        throw new Error("Unsupported schema");
      }
    }

    parentSchema.delete(schema);

    // mark as target if this schema is refed
    if (ref.$ref !== 0) {
      jsonTypeDef.$refTarget = ref.$ref;
    }

    return jsonTypeDef;
  }
}

function getCustomErrorMsg(errorMap?: Z.ZodErrorMap, data?: unknown) {
  if (errorMap) {
    const fakeIssue: Z.ZodInvalidTypeIssue = {
      code: 'invalid_type',
      expected: 'string',
      received: 'number',
      path: []
    };
    const fakeCtx = { data, defaultError: undefined as unknown as string };
    return errorMap(fakeIssue, fakeCtx).message;
  }
}
