export type CompatVault = {
  get: import('./vault').Vault['get'];
  setMetaValue: import('./vault').Vault['setMetaValue'];
  getResourceMeta: import('./vault').Vault['getResourceMeta'];
};

const metaState: any = {};
export const compatVault: CompatVault = {
  get(nonRef: any) {
    return nonRef;
  },
  setMetaValue([id, meta, key], value) {
    const oldValue = compatVault.getResourceMeta(id, meta);
    const oldValueItem = oldValue ? oldValue[key] : undefined;
    const newValue = typeof value === 'function' ? (value as any)(oldValueItem) : value;
    metaState[id] = {
      ...(metaState[id] || {}),
      [meta]: {
        ...((metaState[id] || {})[meta] || {}),
        [key]: newValue,
      },
    };
  },
  getResourceMeta: ((resource: any, metaKey?: any) => {
    const resourceMeta = metaState[resource as any] as any;

    if (!resourceMeta) {
      return undefined;
    }
    if (!metaKey) {
      return resourceMeta;
    }

    return resourceMeta[metaKey];
  }) as any,
};
