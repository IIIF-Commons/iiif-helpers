import type { Reference } from '@iiif/parser/presentation-3/types';
import { compatVault, CompatVault } from './compat';

export function createEventsHelper(vault: CompatVault = compatVault) {
  return {
    addEventListener<T>(
      resource: Reference<any>,
      event: string,
      listener: (e: any, resource: T) => void,
      scope?: string[]
    ) {
      if (!resource) {
        return;
      }

      vault.setMetaValue<Array<{ callback: any; scope?: string[] }>>(
        [resource.id, 'eventManager', event],
        (registeredCallbacks) => {
          const callbacks = registeredCallbacks || [];
          for (const registered of callbacks) {
            if (registered.callback === listener) {
              // @todo check for scopes matching, very edge-case as scopes should be fixed.
              return callbacks;
            }
          }
          return [...callbacks, { callback: listener, scope }];
        }
      );

      return listener;
    },

    removeEventListener<T>(resource: Reference<any>, event: string, listener: (e: any, resource: T) => void) {
      if (!resource) {
        return;
      }
      vault.setMetaValue<Array<{ callback: () => void; scope?: string[] }>>(
        [resource.id, 'eventManager', event],
        (registeredCallbacks) => {
          return (registeredCallbacks || []).filter((registeredCallback) => registeredCallback.callback !== listener);
        }
      );
    },

    getListenersAsProps(resourceOrId: string | Reference<any>, scope?: string[]) {
      const resource = typeof resourceOrId === 'string' ? { id: resourceOrId } : resourceOrId;
      if (!resource || !resource.id) {
        return {};
      }
      const hooks = vault.getResourceMeta(resource.id, 'eventManager');
      const props: any = {};
      if (hooks && resource) {
        for (const hook of Object.keys(hooks)) {
          props[hook] = (e: any) => {
            const fullResource = vault.get<any>(resource);
            for (const { callback, scope: _scope } of hooks[hook] || []) {
              if (!_scope || (scope && _scope.indexOf(scope) !== -1)) {
                callback(e, fullResource);
              }
            }
          };
        }
      }
      return props;
    },
  };
}
