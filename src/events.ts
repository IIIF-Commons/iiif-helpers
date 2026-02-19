import type { Reference as ReferenceV3 } from '@iiif/parser/presentation-3/types';
import type { Reference as ReferenceV4 } from '@iiif/parser/presentation-4/types';
import { type CompatVault, compatVault } from './compat';

type AnyReference = ReferenceV3<any> | ReferenceV4<any>;

export function createEventsHelper(vault: CompatVault = compatVault) {
  return {
    addEventListener<T>(
      resource: AnyReference,
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

    removeEventListener<T>(resource: AnyReference, event: string, listener: (e: any, resource: T) => void) {
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

    getListenersAsProps(resourceOrId: string | AnyReference, scope?: string[]) {
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
