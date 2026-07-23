export function quickMerge(a: any, b: any) {
  const left = a || {};
  const right = b || {};
  const isPartialReference = right['iiif-parser:isExternal'] === true;
  const newResource: any = {};
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);

  for (const key of keys) {
    if (!Object.hasOwn(right, key) || typeof right[key] === 'undefined') {
      newResource[key] = left[key];
      continue;
    }

    // A normalized external reference contains empty defaults that must not
    // erase a previously loaded resource. A complete resource is
    // authoritative, including explicit null and empty-list values.
    if (isPartialReference && (right[key] === null || (Array.isArray(right[key]) && right[key].length === 0))) {
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
