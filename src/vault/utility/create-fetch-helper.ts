import { actionListFromResource } from './action-list-from-resource';
import { resolveIfExists } from './resolve-if-exists';
import { NormalizedEntity } from '../types';
import {
  batchActions,
  requestError,
  requestResource,
  RESOURCE_ERROR,
  RESOURCE_LOADING,
  RESOURCE_READY,
} from '../actions';
import type { Vault } from '../vault';
import { isPromise } from './is-promise';

export function createFetchHelper<T>(
  vault: Vault,
  fetcher: (url: string, options?: T) => any | Promise<any>,
  { waitTimeout = 30 }: { waitTimeout?: number } = {}
) {
  return (url: string, options?: T, mapper?: (r: any) => any): NormalizedEntity | undefined | Promise<NormalizedEntity | undefined> => {
    const store = vault.getStore();
    const state = store.getState();

    const request = state.iiif.requests[url];
    if (request) {
      if (request.loadingState === RESOURCE_READY) {
        // Return the resource.
        const resolvedEntity = resolveIfExists(state, url);
        if (resolvedEntity) {
          return resolvedEntity;
        }
      }

      switch (request.loadingState) {
        case RESOURCE_ERROR:
          // If it has errored, we will try again.
          break;
        case RESOURCE_LOADING: {
          return (async () => {
            // Subscribe and wait for resource to be done for X seconds, otherwise continue.
            let cleanupSubscription: (() => void) | undefined;
            let didContinue = false;
            try {
              const resolvedEntity = await Promise.race<NormalizedEntity | undefined>([
                new Promise<NormalizedEntity | undefined>((resolve, reject) => {
                  if (didContinue) {
                    return;
                  }
                  cleanupSubscription = store.subscribe(() => {
                    const latestState = store.getState();

                    if (latestState.iiif.requests[url].loadingState === RESOURCE_ERROR) {
                      reject();
                      return;
                    }

                    if (latestState.iiif.requests[url].loadingState === RESOURCE_READY) {
                      const maybeResolvedEntity = resolveIfExists(latestState, url);
                      if (maybeResolvedEntity) {
                        resolve(maybeResolvedEntity);
                      } else {
                        reject();
                      }
                    }
                  });
                }),
                new Promise<undefined>((resolve, reject) =>
                  setTimeout(
                    () => {
                      didContinue = true;
                      reject();
                    },
                    waitTimeout * 60 * 1000
                  )
                ),
              ]);
              if (cleanupSubscription) {
                cleanupSubscription();
              }
              if (resolvedEntity) {
                return resolvedEntity;
              }
            } catch (e) {
              if (cleanupSubscription) {
                cleanupSubscription();
              }
            }
          })();
        }
      }

      // do nothing, and return?
    }

    vault.dispatch(requestResource({ id: url }));

    const importResource = (resource: any) => {
      if (!resource) {
        return undefined;
      }
      if (!resource.id && !resource['@id']) {
        if (resource['@type']) {
          // assume it might be presentation 2.
          resource['@id'] = url;
          resource.id = url;
        } else {
          // assume presentation 3.
          resource.id = url;
        }
      }
      const toDispatch = actionListFromResource(url, resource);
      vault.dispatch(batchActions({ actions: toDispatch }));
      return resolveIfExists(store.getState(), url);
    };

    try {
      const resourceOrPromise = fetcher(url, options);

      if (isPromise(resourceOrPromise)) {
        return (async () => {
          try {
            let data = await resourceOrPromise;
            if (mapper) {
              data = mapper(data);
            }
            return importResource(data);
          } catch (err) {
            vault.dispatch(requestError({ id: url, message: (err as any).toString() }));
            // Rethrow.
            throw err;
          }
        })();
      }

      // Assume it is a resource.
      return importResource(mapper ? mapper(resourceOrPromise) : resourceOrPromise);
    } catch (err) {
      vault.dispatch(requestError({ id: url, message: (err as any).toString() }));
      // Rethrow.
      throw err;
    }
  };
}
