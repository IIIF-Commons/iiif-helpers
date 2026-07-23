import { createStore as create } from 'zustand/vanilla';
import { redux, devtools, subscribeWithSelector } from 'zustand/middleware';
import type { SelectorStoreApi } from '../../store-api';
import { mappingReducer } from './reducers/mapping-reducer';
import { entitiesReducer } from './reducers/entities-reducer';
import { requestReducer } from './reducers/request-reducer';
import { metaReducer } from './reducers/meta-reducer';
import { combineReducers } from '../utility/combine-reducers';
import { AllActions, IIIFStore } from '../types';
import { BatchAction } from '../actions';
import { createBatchReducer } from './reducers/batch-reducer';
import { getDefaultEntities } from '../utility';

export const reducers = combineReducers({
  mapping: mappingReducer,
  entities: entitiesReducer,
  requests: requestReducer,
  meta: metaReducer,
});

type CreateStoreOptions = {
  enableDevtools?: boolean;
  iiifStoreName?: string;
  customReducers?: any;
  defaultState?: any;
};

function getDefaultState(): IIIFStore {
  return {
    iiif: {
      entities: getDefaultEntities(),
      meta: {},
      mapping: {},
      requests: {},
    },
  };
}
type VaultAction = AllActions | BatchAction;

export type VaultStoreState = SelectorStoreApi<IIIFStore & { dispatch: (action: VaultAction) => VaultAction }> & {
  dispatch: (action: VaultAction) => VaultAction;
};

export function createStore(options: CreateStoreOptions = {}): VaultStoreState {
  const {
    enableDevtools = false,
    iiifStoreName = 'iiif',
    defaultState = getDefaultState(),
    customReducers = {},
  } = options;

  const rootReducer = createBatchReducer(combineReducers({ [iiifStoreName]: reducers, ...customReducers }));
  const enabled = Boolean(typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__);
  const dv: typeof devtools = !enabled || process.env.NODE_ENV === 'test' ? (a: any, r: any) => a : devtools;

  return create(
    //
    subscribeWithSelector(
      //
      dv(
        //
        redux(rootReducer, defaultState),
        { enabled: enableDevtools }
      )
    )
  );
}

export type VaultZustandStore = VaultStoreState;
