import { createStore as create } from "zustand/vanilla";
import { redux, devtools, subscribeWithSelector } from "zustand/middleware";
import type { SelectorStoreApi } from "../../store-api";
import { mappingReducer } from "./reducers/mapping-reducer";
import { entitiesReducer } from "./reducers/entities-reducer";
import { requestReducer } from "./reducers/request-reducer";
import { metaReducer } from "./reducers/meta-reducer";
import { combineReducers } from "../utility/combine-reducers";
import { IIIFStore } from "../types";
import type { DispatchOptions, VaultAction, VaultCommit } from "../history/types";
import { createBatchReducer } from "./reducers/batch-reducer";
import { getDefaultEntities } from "../utility";

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

export type VaultStoreState = SelectorStoreApi<IIIFStore & { dispatch: (action: VaultAction) => VaultAction }> & {
  dispatch: (action: VaultAction, options?: DispatchOptions) => VaultAction;
  readonly isDispatching: boolean;
  subscribeCommits: (listener: (commit: VaultCommit) => void) => () => void;
  /** Internal two-phase hook: validate first, then finalize before state subscribers run. */
  prepareCommit: (listener: (commit: VaultCommit) => () => void) => () => void;
  onReset: (listener: (phase: "before" | "after") => void) => () => void;
};

export function createStore(options: CreateStoreOptions = {}): VaultStoreState {
  const {
    enableDevtools = false,
    iiifStoreName = "iiif",
    defaultState = getDefaultState(),
    customReducers = {},
  } = options;

  const preparations = new Set<(commit: VaultCommit) => () => void>();
  const listeners = new Set<(commit: VaultCommit) => void>();
  const resets = new Set<(phase: "before" | "after") => void>();
  let revision = 0;
  const storeId = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  let activeOptions: DispatchOptions = {};
  let committed: VaultCommit | undefined;
  const reduce = combineReducers({ [iiifStoreName]: reducers, ...customReducers });
  const rootReducer = (before: IIIFStore, action: VaultAction) => {
    const actions: VaultAction[] = [];
    const after = createBatchReducer(reduce, (leaf) => actions.push(leaf))(before, action);
    const commit: VaultCommit = {
      id: `${storeId}:${revision + 1}`,
      revision: revision + 1,
      action,
      actions,
      options: Object.freeze({ ...activeOptions }),
      before,
      after,
    };
    const finalize = [...preparations].map((prepare) => prepare(commit));
    for (const apply of finalize) apply();
    revision++;
    committed = commit;
    return after;
  };
  const enabled = Boolean(typeof window !== "undefined" && (window as any).__REDUX_DEVTOOLS_EXTENSION__);
  const dv: typeof devtools = !enabled || process.env.NODE_ENV === "test" ? (a: any, _r: any) => a : devtools;

  const store = create(
    //
    subscribeWithSelector(
      //
      dv(
        //
        redux(rootReducer, defaultState),
        { enabled: enableDevtools }
      )
    )
  ) as unknown as VaultStoreState;

  const originalDispatch = store.dispatch;
  let dispatching = false;
  const queue: Array<[VaultAction, DispatchOptions]> = [];
  store.dispatch = (action, options = {}) => {
    queue.push([action, { ...options }]);
    if (dispatching) return action;
    dispatching = true;
    try {
      while (queue.length) {
        const [nextAction, context] = queue.shift()!;
        activeOptions = context;
        committed = undefined;
        try {
          originalDispatch(nextAction);
        } finally {
          // redux publishes synchronously. Reentrant dispatches wait until every
          // observer has seen this commit, including when a subscriber throws.
          const event = committed as VaultCommit | undefined;
          if (event && store.getState().iiif === event.after.iiif) {
            // Snapshot so observers added during publication start with the next commit.
            // oxlint-disable-next-line unicorn/no-useless-spread
            for (const listener of [...listeners]) listener(event);
          }
        }
      }
    } finally {
      dispatching = false;
      activeOptions = {};
      queue.length = 0;
    }
    return action;
  };
  Object.defineProperty(store, "isDispatching", { get: () => dispatching });
  const subscribe = <T>(set: Set<T>, listener: T) => {
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  };
  store.subscribeCommits = (listener) => subscribe(listeners, listener);
  store.prepareCommit = (listener) => subscribe(preparations, listener);
  store.onReset = (listener) => subscribe(resets, listener);
  const setState = store.setState;
  // Also cover callers of getState().dispatch; history must not be bypassed.
  setState({ dispatch: store.dispatch });
  store.setState = ((...args: Parameters<typeof setState>) => {
    if (dispatching) throw new Error("Cannot replace Vault state during a commit");
    const [partial, replace] = args;
    const current = store.getState();
    const value = typeof partial === "function" ? partial(current) : partial;
    if (value === current) return;
    for (const listener of resets) listener("before");
    setState({ ...value, dispatch: store.dispatch } as any, replace as any);
    for (const listener of resets) listener("after");
  }) as typeof store.setState;
  return store;
}

export type VaultZustandStore = VaultStoreState;
