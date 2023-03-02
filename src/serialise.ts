import Z from 'zod';
import { stringify } from './utils';
import type { Ref, SupportedZodType, TypeDef } from './types';

export function serialise(schema: SupportedZodType): string {
  let refSeq = 0;
  const schemaRefs = new Map<SupportedZodType, TypeDef>();
  return stringify(transform(schema));


  function transform(schema: SupportedZodType): TypeDef | Ref {
    let def = schemaRefs.get(schema);
    // return a ref if we have seen this schema
    if (def) {
      // bump sequence and assign a uniq id to the definition
      // if this schema is referenced for the first time
      if (!def.$id) {
        refSeq++;
        def.$id = refSeq;
      }
      return { $ref: def.$id as number };
    }

    // convert to type definition json when seen the first time
    const { typeName, description, errorMap } = schema._def;
    const jsonTypeDef = {
      typeName: typeName,
      description: description,
      required_error: getCustomErrorMsg(errorMap),
      invalid_type_error: getCustomErrorMsg(errorMap, 1),
    } as TypeDef;

    // map schema to the final definition
    schemaRefs.set(schema, jsonTypeDef);

    return Object.assign(jsonTypeDef, getTypeSpecificDefs(schema._def));
  }

  function getTypeSpecificDefs(schemaDef: SupportedZodType["_def"]) {
    switch (schemaDef.typeName) {
      case Z.ZodFirstPartyTypeKind.ZodAny:
      case Z.ZodFirstPartyTypeKind.ZodVoid:
      case Z.ZodFirstPartyTypeKind.ZodNull:
      case Z.ZodFirstPartyTypeKind.ZodNever:
      case Z.ZodFirstPartyTypeKind.ZodUnknown:
      case Z.ZodFirstPartyTypeKind.ZodUndefined: {
        break;
      }
      case Z.ZodFirstPartyTypeKind.ZodLazy: {
        return {
          innerType: transform(schemaDef.getter())
        };
      }
      case Z.ZodFirstPartyTypeKind.ZodBranded:
      case Z.ZodFirstPartyTypeKind.ZodPromise: {
        return {
          innerType: transform(schemaDef.type)
        };
      }
      case Z.ZodFirstPartyTypeKind.ZodNullable:
      case Z.ZodFirstPartyTypeKind.ZodOptional: {
        return {
          innerType: transform(schemaDef.innerType)
        };
      }
      case Z.ZodFirstPartyTypeKind.ZodDefault: {
        return {
          innerType: transform(schemaDef.innerType),
          defaultValue: schemaDef.defaultValue()
        };
      }
      case Z.ZodFirstPartyTypeKind.ZodString: {
        return {
          coerce: schemaDef.coerce || undefined,
          checks: schemaDef.checks.map(c => c.kind !== 'regex' ? c : {
            kind: c.kind,
            message: c.message,
            regex: String(c.regex)
          }),
        };
      }
      case Z.ZodFirstPartyTypeKind.ZodNumber:
      case Z.ZodFirstPartyTypeKind.ZodDate: {
        return {
          checks: schemaDef.checks,
          coerce: schemaDef.coerce || undefined,
        };
      }
      case Z.ZodFirstPartyTypeKind.ZodNaN: {
        return {};
      }
      case Z.ZodFirstPartyTypeKind.ZodBigInt:
      case Z.ZodFirstPartyTypeKind.ZodBoolean: {
        return { coerce: schemaDef.coerce || undefined };
      }
      case Z.ZodFirstPartyTypeKind.ZodArray: {
        return {
          minLength: schemaDef.minLength || undefined,
          maxLength: schemaDef.maxLength || undefined,
          exactLength: schemaDef.exactLength || undefined,
          type: transform(schemaDef.type),
        };
      }
      case Z.ZodFirstPartyTypeKind.ZodObject: {
        const _def = schemaDef as Z.ZodObjectDef;
        return {
          shape: Object.fromEntries(Object.entries(_def.shape()).map(
            ([key, value]) => [key, transform(value)]
          )),
          unknownKeys: schemaDef.unknownKeys,
          catchAll: transform(schemaDef.catchall),
        };
      }
      case Z.ZodFirstPartyTypeKind.ZodTuple: {
        const { items, rest } = schemaDef as Z.ZodTupleDef;
        return {
          items: items.map(i => transform(i)),
          rest: rest ? transform(rest) : undefined,
        };
      }
      case Z.ZodFirstPartyTypeKind.ZodUnion: {
        const _def = schemaDef as Z.ZodUnionDef;
        return {
          options: _def.options.map(op => transform(op))
        };
      }
      case Z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion: {
        const { discriminator, options } = schemaDef as Z.ZodDiscriminatedUnionDef<string>;
        return { discriminator, options: options.map(op => transform(op)) };
      }
      case Z.ZodFirstPartyTypeKind.ZodIntersection: {
        return {
          left: transform(schemaDef.left),
          right: transform(schemaDef.right),
        };
      }
      case Z.ZodFirstPartyTypeKind.ZodPipeline: {
        return {
          left: transform(schemaDef.in),
          right: transform(schemaDef.out),
        };
      }
      case Z.ZodFirstPartyTypeKind.ZodRecord:
      case Z.ZodFirstPartyTypeKind.ZodMap: {
        const { keyType, valueType } = schemaDef;
        return {
          keyType: transform(keyType),
          valueType: transform(valueType),
        };
      }
      case Z.ZodFirstPartyTypeKind.ZodSet: {
        const { valueType, minSize, maxSize } = schemaDef;
        return {
          valueType: transform(valueType),
          minSize: minSize || undefined,
          maxSize: maxSize || undefined,
        };
      }
      case Z.ZodFirstPartyTypeKind.ZodLiteral: {
        return { value: schemaDef.value };
      }
      case Z.ZodFirstPartyTypeKind.ZodEnum:
      case Z.ZodFirstPartyTypeKind.ZodNativeEnum: {
        return { values: schemaDef.values };
      }
      case Z.ZodFirstPartyTypeKind.ZodFunction: {
        return {
          args: transform(schemaDef.args),
          returns: transform(schemaDef.returns)
        };
      }
      case Z.ZodFirstPartyTypeKind.ZodCatch: {
        return {
          innerType: transform(schemaDef.innerType),
          value: schemaDef.catchValue()
        };
      }
      default: {
        throw new Error("Unsupported schema");
      }
    }
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
