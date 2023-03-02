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

Currently, all built-in Zod types except ZodEffect are supported with below known limitations

### ZodCatch

Only constant catch value is supported
```js
// constant value is supported
z.string().catch("fallback");

// catch function that returns a constant value is supported
z.string().catch(() => "fallback");

// this is also okay
const s = "fallback";
z.string().catch(() => s);

// this is not supported, because a different Date will be returned for each call; in this example, timestamp of when serialisation runs will be captured and is used as the catch value after deserialisation
z.date().catch(() => new Date());

```