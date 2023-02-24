import type Z from "zod";

export type SupportedZodType =
  | Z.ZodString
  | Z.ZodNumber
  | Z.ZodNaN
  | Z.ZodBigInt
  | Z.ZodBoolean
  | Z.ZodDate
  | Z.ZodUndefined
  | Z.ZodNull
  | Z.ZodAny
  | Z.ZodUnknown
  | Z.ZodNever
  | Z.ZodVoid
  | Z.ZodArray<any, any>
  | Z.ZodObject<any, any, any>
  | Z.ZodUnion<any>
  | Z.ZodDiscriminatedUnion<any, any>
  | Z.ZodIntersection<any, any>
  | Z.ZodTuple<any, any>
  | Z.ZodRecord<any, any>
  | Z.ZodMap<any>
  | Z.ZodSet<any>
  | Z.ZodLiteral<any>
  | Z.ZodEnum<any>
  | Z.ZodNativeEnum<any>
  | Z.ZodOptional<any>
  | Z.ZodNullable<any>
  | Z.ZodDefault<any>
  | Z.ZodFunction<any, any>
  | Z.ZodLazy<any>
  | Z.ZodCatch<any>
  | Z.ZodPromise<any>
  | Z.ZodBranded<any, any>
  | Z.ZodPipeline<any, any>
  // | Z.ZodEffects<any, any, any>
  ;

// special ref to deal with circular ref
export type Ref = { $ref: number };

type BaseDef = {
  $id?: number;
  description?: string;
  required_error?: string;
  invalid_type_error?: string;
}

export type SimpleDef = BaseDef & {
  typeName:
    | Z.ZodFirstPartyTypeKind.ZodAny
    | Z.ZodFirstPartyTypeKind.ZodNaN
    | Z.ZodFirstPartyTypeKind.ZodNull
    | Z.ZodFirstPartyTypeKind.ZodVoid
    | Z.ZodFirstPartyTypeKind.ZodNever
    | Z.ZodFirstPartyTypeKind.ZodUnknown
    | Z.ZodFirstPartyTypeKind.ZodUndefined;
}

export type ScalarDef = BaseDef & {
  typeName:
    | Z.ZodFirstPartyTypeKind.ZodDate
    | Z.ZodFirstPartyTypeKind.ZodString
    | Z.ZodFirstPartyTypeKind.ZodNumber
    | Z.ZodFirstPartyTypeKind.ZodBigInt
    | Z.ZodFirstPartyTypeKind.ZodBoolean;
  checks?: Array<unknown>;
  coerce?: true;
};

export type WrapperDef = BaseDef & {
  typeName:
    | Z.ZodFirstPartyTypeKind.ZodLazy
    | Z.ZodFirstPartyTypeKind.ZodBranded
    | Z.ZodFirstPartyTypeKind.ZodPromise
    | Z.ZodFirstPartyTypeKind.ZodNullable
    | Z.ZodFirstPartyTypeKind.ZodOptional;
  innerType: TypeDef;
};

export type ObjectDef = BaseDef & {
  typeName: Z.ZodFirstPartyTypeKind.ZodObject;
  shape: Record<string, TypeDef>;
  unknownKeys: Z.UnknownKeysParam;
  catchAll: TypeDef;
};

export type ArrayDef = BaseDef & {
  typeName: Z.ZodFirstPartyTypeKind.ZodArray;
  type: TypeDef;
  exactLength?: NonNullable<Z.ZodArrayDef["exactLength"]>;
  minLength?: NonNullable<Z.ZodArrayDef["minLength"]>;
  maxLength?: NonNullable<Z.ZodArrayDef["maxLength"]>;
};

export type UnionDef = BaseDef & {
  typeName: Z.ZodFirstPartyTypeKind.ZodUnion;
  options: TypeDef[];
};

export type DiscriminatedUnionDef = BaseDef & {
  typeName: Z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion;
  discriminator: string;
  options: ObjectDef[];
};

export type IntersectionDef = BaseDef & {
  typeName:
    | Z.ZodFirstPartyTypeKind.ZodPipeline
    | Z.ZodFirstPartyTypeKind.ZodIntersection;
  left: TypeDef;
  right: TypeDef;
};

export type RecordDef = BaseDef & {
  typeName:
    | Z.ZodFirstPartyTypeKind.ZodMap
    | Z.ZodFirstPartyTypeKind.ZodRecord;
  keyType: TypeDef;
  valueType: TypeDef;
};

export type TupleDef = BaseDef & {
  typeName: Z.ZodFirstPartyTypeKind.ZodTuple;
  items: TypeDef[];
  rest?: TypeDef;
};

export type SetDef = BaseDef & {
  typeName: Z.ZodFirstPartyTypeKind.ZodSet;
  valueType: TypeDef;
  minSize?: Z.ZodSetDef["minSize"];
  maxSize?: Z.ZodSetDef["maxSize"];
};

export type LiteralDef = BaseDef & {
  typeName: Z.ZodFirstPartyTypeKind.ZodLiteral;
  value: Z.ZodLiteralDef["value"];
};

export type EnumDef = BaseDef & {
  typeName: Z.ZodFirstPartyTypeKind.ZodEnum;
  values: [string, ...string[]];
};

export type NativeEnumDef = BaseDef & {
  typeName: Z.ZodFirstPartyTypeKind.ZodNativeEnum;
  values: Z.EnumLike;
};

export type DefaultDef = BaseDef & {
  typeName: Z.ZodFirstPartyTypeKind.ZodDefault;
  innerType: TypeDef;
  defaultValue: ReturnType<Z.ZodDefaultDef["defaultValue"]>;
};

export type FunctionDef = BaseDef & {
  typeName: Z.ZodFirstPartyTypeKind.ZodFunction;
  args: TupleDef;
  returns: TypeDef;
};

export type CatchDef = BaseDef & {
  typeName: Z.ZodFirstPartyTypeKind.ZodCatch;
  innerType: TypeDef;
  value: unknown;
};

export type TypeDef =
  | SimpleDef
  | ScalarDef
  | WrapperDef
  | DefaultDef
  | ArrayDef
  | ObjectDef
  | RecordDef
  | UnionDef
  | DiscriminatedUnionDef
  | IntersectionDef
  | TupleDef
  | SetDef
  | LiteralDef
  | EnumDef
  | NativeEnumDef
  | FunctionDef
  | CatchDef
  ;
