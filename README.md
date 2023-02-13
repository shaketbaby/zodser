# zodser

A serialisation and deserialisation libarary for Zod.

This is useful when there is a need to keep a list of historic versions of zod schema.

# Install

```bash
npm install zodser
```

```bash
yarn add zodser
```

# Usages

To serialise a zod schema to a string for saving
```js
import { serialise } from "zodser";

const schemaString = serialise(zodSchema);
```

To deserialise a previously serialised zod schema string
```js
import { deserialise } from "zodser";

const zodSchema = deserialise(schemaString);
```

## limitations

Currently, only following zod types are supported

```
ZodString
ZodNumber
ZodNaN
ZodBigInt
ZodBoolean
ZodDate
ZodUndefined
ZodNull
ZodAny
ZodUnknown
ZodNever
ZodVoid
ZodArray
ZodObject
ZodUnion
ZodDiscriminatedUnion
ZodIntersection
ZodTuple
ZodRecord
ZodMap
ZodSet
ZodLiteral
ZodEnum
ZodNativeEnum
ZodOptional
ZodNullable
ZodDefault
```
