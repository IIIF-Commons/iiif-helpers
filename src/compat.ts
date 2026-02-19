export type CompatVault = {
  get: import('./vault').Vault['get'];
  setMetaValue: import('./vault').Vault['setMetaValue'];
  getResourceMeta: import('./vault').Vault['getResourceMeta'];
  load: import('./vault').Vault['load'];
  requestStatus: import('./vault').Vault['requestStatus'];
  subscribe: import('./vault').Vault['subscribe'];
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
  async load(id: string | { type: any; id: string }) {
    const idToLoad = typeof id === 'string' ? id : id.id;

    // @todo this could do an upgrade..
    return fetch(idToLoad).then((response) => response.json());
  },
  subscribe(fn: any) {
    return () => {};
  },
  requestStatus(id: string) {
    // Never any request status in this context.
    return undefined;
  },
};
