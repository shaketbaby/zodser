import Z from 'zod';
import type { ScalarDef, TypeDef, WrapperDef, DefaultDef, SupportedZodType, Ref } from './types';

type MultipleZodTypes = [Z.ZodTypeAny, Z.ZodTypeAny];

export function deserialise(str: string): SupportedZodType {
  const refs = {} as Record<number, SupportedZodType>;
  return rebuild(JSON.parse(str));

  function rebuild(typeDefOrRef: TypeDef | Ref): SupportedZodType {

    if ((typeDefOrRef as Ref).$ref) {
      return refs[(typeDefOrRef as Ref).$ref];
    }

    const typeDef = typeDefOrRef as TypeDef;

    const zodSchema: SupportedZodType = buildInstance();
    if (typeDef.$id) {
      refs[typeDef.$id] = zodSchema;
    }
    return populateZodDef();


    function buildInstance() {
      const { description, invalid_type_error, required_error } = typeDef;
      const params = { description, invalid_type_error, required_error };
      const dummyType = Z.object({ key: Z.string() }, params);
      switch (typeDef.typeName) {
        case Z.ZodFirstPartyTypeKind.ZodNullable: {
          return Z.nullable(dummyType, params);
        }
        case Z.ZodFirstPartyTypeKind.ZodOptional: {
          return Z.optional(dummyType, params);
        }
        case Z.ZodFirstPartyTypeKind.ZodDefault: {
          return dummyType.default({ key: 'v' });
        }
        case Z.ZodFirstPartyTypeKind.ZodAny: {
          return Z.any(params);
        }
        case Z.ZodFirstPartyTypeKind.ZodNever: {
          return Z.never(params);
        }
        case Z.ZodFirstPartyTypeKind.ZodNull: {
          return Z.null(params);
        }
        case Z.ZodFirstPartyTypeKind.ZodUndefined: {
          return Z.undefined(params);
        }
        case Z.ZodFirstPartyTypeKind.ZodUnknown: {
          return Z.unknown(params);
        }
        case Z.ZodFirstPartyTypeKind.ZodVoid: {
          return Z.void(params);
        }
        case Z.ZodFirstPartyTypeKind.ZodString: {
          return Z.string(params);
        }
        case Z.ZodFirstPartyTypeKind.ZodNumber: {
          return Z.number(params);
        }
        case Z.ZodFirstPartyTypeKind.ZodNaN: {
          return Z.nan(params);
        }
        case Z.ZodFirstPartyTypeKind.ZodBigInt: {
          return Z.bigint(params);
        }
        case Z.ZodFirstPartyTypeKind.ZodBoolean: {
          return Z.boolean(params);
        }
        case Z.ZodFirstPartyTypeKind.ZodDate: {
          return Z.date(params);
        }
        case Z.ZodFirstPartyTypeKind.ZodArray: {
          return Z.array(dummyType, params);
        }
        case Z.ZodFirstPartyTypeKind.ZodObject: {
          return Z.object({}, params);
        }
        case Z.ZodFirstPartyTypeKind.ZodUnion: {
          return Z.union([dummyType, dummyType], params);
        }
        case Z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion: {
          return Z.discriminatedUnion('key', [dummyType], params);
        }
        case Z.ZodFirstPartyTypeKind.ZodIntersection: {
          return Z.intersection(dummyType, dummyType, params);
        }
        case Z.ZodFirstPartyTypeKind.ZodTuple: {
          return Z.tuple([], params);
        }
        case Z.ZodFirstPartyTypeKind.ZodRecord: {
          return Z.record(dummyType, params);
        }
        case Z.ZodFirstPartyTypeKind.ZodMap: {
          return Z.map(dummyType, dummyType, params);
        }
        case Z.ZodFirstPartyTypeKind.ZodSet: {
          return Z.set(dummyType, params);
        }
        case Z.ZodFirstPartyTypeKind.ZodLiteral: {
          return Z.literal(1);
        }
        case Z.ZodFirstPartyTypeKind.ZodEnum: {
          return Z.enum(['enum']);
        }
        case Z.ZodFirstPartyTypeKind.ZodNativeEnum: {
          return Z.nativeEnum({});
        }
        default: {
          throw new Error("Unsupported schema");
        }
      }
    }

    function populateZodDef() {
      const zodDef = zodSchema._def;
      switch (typeDef.typeName) {
        case Z.ZodFirstPartyTypeKind.ZodAny:
        case Z.ZodFirstPartyTypeKind.ZodNaN:
        case Z.ZodFirstPartyTypeKind.ZodNull:
        case Z.ZodFirstPartyTypeKind.ZodVoid:
        case Z.ZodFirstPartyTypeKind.ZodNever:
        case Z.ZodFirstPartyTypeKind.ZodUnknown:
        case Z.ZodFirstPartyTypeKind.ZodUndefined:
          break;
        case Z.ZodFirstPartyTypeKind.ZodNullable: {
          const { innerType } = typeDef as WrapperDef;
          (zodDef as Z.ZodNullableDef).innerType = rebuild(innerType);
          break;
        }
        case Z.ZodFirstPartyTypeKind.ZodOptional: {
          const { innerType } = typeDef as WrapperDef;
          (zodDef as Z.ZodOptionalDef).innerType = rebuild(innerType);
          break;
        }
        case Z.ZodFirstPartyTypeKind.ZodDefault: {
          const { innerType, defaultValue } = typeDef as DefaultDef;
          Object.assign(zodDef, {
            innerType: rebuild(innerType),
            defaultValue: () => defaultValue,
          });
          break;
        }
        case Z.ZodFirstPartyTypeKind.ZodString: {
          const { checks, coerce } = typeDef as ScalarDef;
          const strChecks = checks as Z.ZodStringCheck[];
          const toRegExp = (regex: string) => {
            const [_, pattern, flags] = String(regex).split("/");
            return new RegExp(pattern, flags);
          }
          Object.assign(zodSchema._def, {
            coerce: coerce || false,
            checks: strChecks.map(c => c.kind !== 'regex' ? c : {
              ...c, regex: toRegExp(String(c.regex))
            }),
          });
          break;
        }
        case Z.ZodFirstPartyTypeKind.ZodNumber: {
          const { checks, coerce } = typeDef as ScalarDef;
          Object.assign(zodDef, {
            coerce: coerce || false,
            checks: checks as Z.ZodNumberCheck[],
          })
          break;
        }
        case Z.ZodFirstPartyTypeKind.ZodBigInt:
        case Z.ZodFirstPartyTypeKind.ZodBoolean: {
          Object.assign(zodDef, {
            coerce: typeDef.coerce || false,
          })
          break;
        }
        case Z.ZodFirstPartyTypeKind.ZodDate: {
          Object.assign(zodDef, {
            coerce: typeDef.coerce || false,
            checks: (typeDef.checks || []) as Z.ZodDateCheck[],
          })
          break;
        }
        case Z.ZodFirstPartyTypeKind.ZodArray: {
          Object.assign(zodDef, {
            type: rebuild(typeDef.type),
            exactLength: typeDef.exactLength || null,
            minLength: typeDef.minLength || null,
            maxLength: typeDef.maxLength || null,

          })
          break;
        }
        case Z.ZodFirstPartyTypeKind.ZodObject: {
          const shapeSchema = Object.fromEntries(Object.entries(typeDef.shape).map(
            ([key, value]) => [key, rebuild(value)]
          ));
          Object.assign(zodDef, {
            typeName: typeDef.typeName,
            catchall: rebuild(typeDef.catchAll),
            unknownKeys: typeDef.unknownKeys,
            shape: () => shapeSchema,
          });
          break;
        }
        case Z.ZodFirstPartyTypeKind.ZodUnion: {
          const types = typeDef.options.map(op => rebuild(op));
          (zodDef as Z.ZodUnionDef).options = types as MultipleZodTypes;
          break;
        }
        case Z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion: {
          type Option = Z.ZodDiscriminatedUnionOption<string>;
          const options = typeDef.options.map(op => rebuild(op));
          const du = Z.discriminatedUnion(typeDef.discriminator, options as [Option, Option]);
          Object.assign(zodDef, {
            discriminator: du._def.discriminator,
            optionsMap: du._def.optionsMap,
            options: du._def.options,
          });
          break;
        }
        case Z.ZodFirstPartyTypeKind.ZodIntersection: {
          Object.assign(zodDef, {
            left: rebuild(typeDef.left),
            right: rebuild(typeDef.right),
          });
          break;
        }
        case Z.ZodFirstPartyTypeKind.ZodTuple: {
          const { items, rest } = typeDef;
          Object.assign(zodDef, {
            items: items.map(i => rebuild(i)) as MultipleZodTypes,
            rest: rest ? rebuild(rest) : null
          });
          break;
        }
        case Z.ZodFirstPartyTypeKind.ZodMap:
        case Z.ZodFirstPartyTypeKind.ZodRecord: {
          Object.assign(zodDef, {
            keyType: rebuild(typeDef.keyType),
            valueType: rebuild(typeDef.valueType),
          })
          break;
        }
        case Z.ZodFirstPartyTypeKind.ZodSet: {
          Object.assign(zodDef, {
            valueType: rebuild(typeDef.valueType),
            minSize: typeDef.minSize || null,
            maxSize: typeDef.maxSize || null,
          })
          break;
        }
        case Z.ZodFirstPartyTypeKind.ZodLiteral: {
          (zodDef as Z.ZodLiteralDef).value = typeDef.value;
          break;
        }
        case Z.ZodFirstPartyTypeKind.ZodEnum: {
          (zodDef as Z.ZodEnumDef).values = typeDef.values;
          break;
        }
        case Z.ZodFirstPartyTypeKind.ZodNativeEnum: {
          (zodDef as Z.ZodNativeEnumDef).values = typeDef.values;
          break;
        }
      }

      return zodSchema;
    }
  }
}
