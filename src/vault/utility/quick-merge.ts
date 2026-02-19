export function quickMerge(a: any, b: any) {
  const left = a || {};
  const right = b || {};
  const newResource: any = {};
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);

  for (const key of keys) {
    if (!Object.hasOwn(right, key) || typeof right[key] === 'undefined') {
      newResource[key] = left[key];
      continue;
    }

    // Imported normalized entities often include placeholder defaults.
    // Do not let null/empty-array placeholders clobber richer existing values.
    if (right[key] === null) {
      newResource[key] = left[key];
      continue;
    }

    if (Array.isArray(right[key]) && right[key].length === 0) {
      newResource[key] = left[key];
      continue;
    }

    if (typeof right[key] !== 'undefined') {
      newResource[key] = right[key];
      continue;
    }

    newResource[key] = left[key];
  }

  return newResource;
}
