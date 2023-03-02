enum Type {
  Date = 'date',
  BigInt = 'bigint',
  NaN = 'nan',
  Infinity = 'infinity',
  Symbol = 'symbol',
}

const typeKey = '@@type';

export function stringify(obj: unknown): string {
  if (obj instanceof Date) {
    return JSON.stringify({ [typeKey]: Type.Date, v: obj.getTime() });
  }
  return JSON.stringify(obj, function (key: string, value: unknown) {
    switch (typeof (value)) {
      case 'string':
        if (this[key] instanceof Date) {
          return { [typeKey]: Type.Date, v: this[key].getTime() }
        }
        break;
      case 'number':
        if (isNaN(value)) {
          return { [typeKey]: Type.NaN };
        }
        if (!isFinite(value)) {
          return { [typeKey]: Type.Infinity, v: value.toString() };
        }
        break;
      case 'bigint':
        return { [typeKey]: Type.BigInt, v: value.toString() };
      case 'symbol':
        return { [typeKey]: Type.Symbol, v: Symbol.keyFor(value) };
    }
    return value;
  }
  );
}

export function parseJson(json: string) {
  return JSON.parse(json, function receiver(key: string, value: any) {
    if (value && (typeof value === 'object') && value[typeKey]) {
      switch (value[typeKey]) {
        case Type.Date:
          return new Date(value.v);
        case Type.NaN:
          return NaN;
        case Type.Infinity:
          return Number(value.v);
        case Type.BigInt:
          return BigInt(value.v);
        case Type.Symbol:
          return Symbol.for(value.v);
      }
    }
    return value;
  })
}
