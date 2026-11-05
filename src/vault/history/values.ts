/** Tagged values preserve missing properties, undefined, sparse arrays and non-finite numbers over JSON. */
export type EncodedValue =
  | ["undefined"]
  | ["null"]
  | ["boolean", boolean]
  | ["number", string]
  | ["string", string]
  | ["array", number, Array<[number, EncodedValue]>]
  | ["object", Array<[string, EncodedValue]>];

export type ValueSnapshot = { exists: false } | { exists: true; value: EncodedValue };

export function encodeValue(value: unknown, ancestors = new Set<object>()): EncodedValue {
  if (value === undefined) return ["undefined"];
  if (value === null) return ["null"];
  if (typeof value === "boolean") return ["boolean", value];
  if (typeof value === "string") return ["string", value];
  if (typeof value === "number") return ["number", Object.is(value, -0) ? "-0" : String(value)];
  if (typeof value !== "object" || ancestors.has(value)) {
    throw new Error("Vault history only supports acyclic data values");
  }
  if (Object.getOwnPropertySymbols(value).length) throw new Error("Vault history does not support symbol properties");
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return [
        "array",
        value.length,
        Object.keys(value).map((key) => {
          const index = Number(key);
          if (!Number.isInteger(index) || index < 0 || index >= value.length) {
            throw new Error("Vault history does not support custom array properties");
          }
          return [index, encodeValue(value[index], ancestors)];
        }),
      ];
    }
    if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
      throw new Error("Vault history only supports plain objects");
    }
    return [
      "object",
      Object.keys(value)
        .sort()
        .map((key) => [key, encodeValue((value as any)[key], ancestors)]),
    ];
  } finally {
    ancestors.delete(value);
  }
}

export function decodeValue(value: EncodedValue): any {
  switch (value[0]) {
    case "undefined":
      return undefined;
    case "null":
      return null;
    case "boolean":
    case "string":
      return value[1];
    case "number":
      return Number(value[1]);
    case "array": {
      const result: any[] = [];
      result.length = value[1];
      for (const [index, item] of value[2]) result[index] = decodeValue(item);
      return result;
    }
    case "object": {
      const result = {};
      for (const [key, item] of value[1]) {
        Object.defineProperty(result, key, {
          value: decodeValue(item),
          enumerable: true,
          configurable: true,
          writable: true,
        });
      }
      return result;
    }
  }
}

export function snapshot(parent: any, key: string): ValueSnapshot {
  return parent != null && Object.hasOwn(parent, key)
    ? { exists: true, value: encodeValue(parent[key]) }
    : { exists: false };
}

export function snapshotsEqual(a: ValueSnapshot, b: ValueSnapshot): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
}
