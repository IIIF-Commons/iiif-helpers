/// <reference types="geojson" />

import {
  ActionFromType,
  AllActions,
  Entities,
  IIIFStore,
  NormalizedEntity,
  PaginationState,
  RefToNormalized,
  RequestState,
} from './types';
import { Collection, Manifest, Reference, SpecificResource } from '@iiif/parser/presentation-4/types';
import { frameResource, HAS_PART, isSpecificResource, PART_OF, serializeConfigPresentation2 } from '@iiif/parser';
import {
  serialize,
  SerializeConfig,
  serializeConfigPresentation3,
  serializeConfigPresentation4,
} from '@iiif/parser/presentation-4';
import { BATCH_ACTIONS, BatchAction, batchActions, entityActions, metaActions } from './actions';
import { createFetchHelper, areInputsEqual } from './utility';
import { createStore, VaultZustandStore } from './store';
import mitt, { Emitter } from 'mitt';
import {
  CollectionNormalized as CollectionNormalizedV4,
  ManifestNormalized as ManifestNormalizedV4,
} from '@iiif/parser/presentation-4-normalized/types';
import { isWrapped, ReactiveWrapped, wrapObject } from './utility/objects';
import { resolveType } from './utility/resolve-type';
import { actionListFromResourceV4, type ActionListFromResource } from './utility/action-list-from-resource';
import { defaultFetcher as defaultVaultFetcher } from './utility/default-fetcher';

type RefToNormalizedV4<Ref extends { type?: string }> = Ref['type'] extends 'Manifest'
  ? ManifestNormalizedV4
  : Ref['type'] extends 'Collection'
    ? CollectionNormalizedV4
    : RefToNormalized<Ref>;

type VaultOptions = {
  reducers: Record<string, any>;
  defaultState?: IIIFStore;
  customFetcher: <T>(url: string, options: T) => unknown | Promise<unknown>;
  enableDevtools: boolean;
};

type GetOptions = {
  skipSelfReturn?: boolean;
  parent?: Reference<any> | string;
  preserveSpecificResources?: boolean;
  skipPartOfCheck?: boolean;
};
type GetObjectOptions = GetOptions & { reactive?: boolean };

type AllActionsType = AllActions['type'];

type EntityRef<Ref extends keyof Entities> = IIIFStore['iiif']['entities'][Ref][string];

export type Vault4Options = VaultOptions;
export type Vault4GetOptions = GetOptions;
export type Vault4GetObjectOptions = GetObjectOptions;
export type Vault4EntityRef<Ref extends keyof Entities> = EntityRef<Ref>;

export class Vault4 {
  protected readonly options: VaultOptions;
  private readonly store: VaultZustandStore;
  private readonly emitter: Emitter<any>;
  private isBatching = false;
  private batchQueue: AllActions[] = [];
  remoteFetcher: (str: string, options?: any, mapper?: (resource: any) => any) => Promise<NormalizedEntity | undefined>;
  staticFetcher: (
    str: string,
    json: any,
    mapper?: (resource: any) => any
  ) => Promise<NormalizedEntity | undefined> | NormalizedEntity | undefined;

  constructor(options?: Partial<VaultOptions>, store?: VaultZustandStore) {
    this.options = Object.assign(
      {
        reducers: {},
        customFetcher: this.defaultFetcher,
        enableDevtools: true,
      },
      options || {}
    );
    this.store =
      store ||
      createStore({
        customReducers: this.options.reducers,
        defaultState: this.options.defaultState,
        enableDevtools: this.options.enableDevtools,
      });
    this.emitter = mitt();
    this.remoteFetcher = createFetchHelper(this as any, this.options.customFetcher, {
      actionListFromResource: this.getActionListFromResource(),
    }) as any;
    this.staticFetcher = createFetchHelper(this as any, (id: string, json: any) => json, {
      actionListFromResource: this.getActionListFromResource(),
    });
  }

  protected getActionListFromResource(): ActionListFromResource {
    return actionListFromResourceV4;
  }

  defaultFetcher = defaultVaultFetcher;

  batch(cb: (vault: this) => void) {
    this.isBatching = true;
    try {
      cb(this);
      this.isBatching = false;
      this.dispatch(batchActions({ actions: this.batchQueue }));
    } catch (e) {
      // Even if we error, we still need to reset the queue.
      this.batchQueue = [];
      this.isBatching = false;
      // And then rethrow.
      throw e;
    }
    this.batchQueue = [];
  }

  async asyncBatch(cb: (vault: this) => Promise<void> | void) {
    this.isBatching = true;
    try {
      await cb(this);
      this.isBatching = false;
      this.dispatch(batchActions({ actions: this.batchQueue }));
    } catch (e) {
      // Even if we error, we still need to reset the queue.
      this.batchQueue = [];
      this.isBatching = false;
      // And then rethrow.
      throw e;
    }
    this.batchQueue = [];
  }

  modifyEntityField(entity: Reference<keyof Entities>, key: string, value: any) {
    this.dispatch(
      entityActions.modifyEntityField({
        id: entity.id,
        type: entity.type,
        key,
        value,
      })
    );
  }

  dispatch(action: AllActions | BatchAction) {
    if (!this.isBatching) {
      if (action.type === BATCH_ACTIONS) {
        for (const realAction of action.payload.actions) {
          this.emitter.emit(realAction.type, { action: realAction, state: this.store.getState() });
        }
        this.store.dispatch(action);
        const state = this.getState();
        for (const realAction of action.payload.actions) {
          this.emitter.emit(`after:${realAction.type}`, { action: realAction, state });
        }
        return;
      }

      this.emitter.emit(action.type, { action, state: this.store.getState() });
      this.store.dispatch(action);
      const state = this.store.getState();
      this.emitter.emit(`after:${action.type}`, { action, state });
      return;
    } else {
      this.batchQueue.push(action as AllActions);
    }
  }

  on<Type extends AllActions['type']>(
    event: Type | `after:${Type}`,
    handler: (ctx: { action: ActionFromType<Type>; state: IIIFStore }) => void
  ) {
    this.emitter.on(event, handler);
    return () => {
      this.emitter.off(event, handler);
    };
  }

  serialize<Return>(entity: Reference<keyof Entities>, config: SerializeConfig) {
    return serialize<Return>(this.getState().iiif as any, entity as any, config as any);
  }

  toPresentation2<Return>(entity: Reference<keyof Entities>) {
    return this.serialize<Return>(entity, serializeConfigPresentation2 as any);
  }

  toPresentation3<Return>(entity: Reference<keyof Entities>) {
    return this.serialize<Return>(entity, serializeConfigPresentation3);
  }

  toPresentation4<Return>(entity: Reference<keyof Entities>) {
    return this.serialize<Return>(entity, serializeConfigPresentation4);
  }

  hydrate<R extends { type?: string }>(
    reference: string | Partial<R>,
    type?: string | GetOptions,
    options?: GetOptions
  ): RefToNormalizedV4<R>;
  hydrate<R extends { type?: string }>(
    reference: string[] | Partial<R>[],
    type?: string | GetOptions,
    options?: GetOptions
  ): RefToNormalizedV4<R>[];
  hydrate<R extends { type?: string }>(
    reference: string | R | NormalizedEntity | string[] | R[] | NormalizedEntity[],
    type?: string | GetOptions,
    options: GetOptions = {}
  ): RefToNormalizedV4<R> | RefToNormalizedV4<R>[] {
    return this.get<R>(reference as any, type as any, { ...options, skipSelfReturn: false });
  }

  get<R extends { type?: string }>(
    reference: string | Partial<R> | Reference<R['type']> | SpecificResource,
    type?: string | GetOptions,
    options?: GetOptions
  ): RefToNormalizedV4<R>;
  get<R extends { type?: string }>(
    reference: string[] | Partial<R>[] | Reference<R['type']>[] | SpecificResource[],
    type?: string | GetOptions,
    options?: GetOptions
  ): RefToNormalizedV4<R>[];
  get<R extends { type?: string }>(
    reference:
      | string
      | R
      | NormalizedEntity
      | string[]
      | R[]
      | NormalizedEntity[]
      | SpecificResource
      | SpecificResource[],
    type?: string | GetOptions,
    options: GetOptions = {}
  ): RefToNormalizedV4<R> | RefToNormalizedV4<R>[] {
    if (typeof type !== 'string') {
      options = type || {};
      type = undefined;
    }

    const { skipSelfReturn = true } = options || {};
    let parent = options.parent ? (typeof options.parent === 'string' ? options.parent : options.parent.id) : undefined;

    // Multiples.
    if (Array.isArray(reference)) {
      return (reference as any[]).map((i) => this.get(i, options)) as EntityRef<any>[];
    }

    const state = this.getState();

    if (isSpecificResource(reference) && !options.preserveSpecificResources) {
      reference = reference.source;
    }

    // String IDs.
    if (typeof reference === 'string') {
      const _type: any = resolveType(type ? type : state.iiif.mapping[reference]);
      if (!_type) {
        if (skipSelfReturn) {
          return null as any;
        }
        return { id: reference, type: 'unknown' } as any;
      }
      reference = { id: reference, type: _type };
    }

    if (reference && (reference as any).partOf && !parent && !options.skipPartOfCheck) {
      const first = Array.isArray((reference as any).partOf) ? (reference as any).partOf[0] : (reference as any).partOf;
      if (first) {
        if (typeof first === 'string') {
          parent = first;
        }
        if (typeof first.id === 'string') {
          parent = first.id;
        }
      }
    }

    const _type = resolveType(type ? type : (reference as any)?.type);
    const _id = (reference as any)?.id;
    const entities = (state.iiif.entities as any)[_type];
    if (!entities) {
      const request = state.iiif.requests[_id];
      if (request && request.resourceUri !== _id) {
        return this.get(request.resourceUri, options);
      }

      if (skipSelfReturn) {
        return null as any;
      }
      return reference as any;
    }

    const found = entities[(reference as any).id];
    if (found && found[HAS_PART]) {
      const framing = found[HAS_PART].find((t: any) => {
        return parent ? t[PART_OF] === parent : t[PART_OF] === found.id;
      });
      return frameResource(found, framing);
    }

    return entities[(reference as any).id] || (skipSelfReturn ? null : reference);
  }

  select<R>(selector: (state: IIIFStore) => R): R {
    return selector(this.getState());
  }

  getStore(): VaultZustandStore {
    return this.store;
  }

  getState(): IIIFStore {
    return this.store.getState();
  }

  deep(input?: any, prev?: any) {
    if (typeof input === 'undefined') {
      return this.get(prev, { skipSelfReturn: false });
    }
    if (typeof input === 'function') {
      try {
        const next = input(this.get(prev, { skipSelfReturn: false }));
        const fn: any = (newInput: any) => this.deep(newInput, next);
        fn.size = Array.isArray(next) ? next.length : 1;
        return fn;
      } catch (e) {
        const fn: any = (newInput: any) => this.deep(newInput, undefined);
        fn.size = 0;
        return fn;
      }
    }
    const fn: any = (newInput: any) => this.deep(newInput, input);
    fn.size = Array.isArray(input) ? input.length : 1;
    return fn;
  }

  loadManifest(
    id: string | Reference<any>,
    json?: unknown,
    mapper?: (resource: any) => any
  ): Promise<ManifestNormalizedV4 | undefined> {
    const _id = typeof id === 'string' ? id : id.id;
    return this.load<ManifestNormalizedV4>(_id, json, mapper);
  }

  loadCollection(
    id: string | Reference<any>,
    json?: unknown,
    mapper?: (resource: any) => any
  ): Promise<CollectionNormalizedV4 | undefined> {
    const _id = typeof id === 'string' ? id : id.id;
    return this.load<CollectionNormalizedV4>(_id, json, mapper);
  }

  load<T>(id: string | Reference<any>, json?: unknown, mapper?: (resource: any) => any): Promise<T | undefined> {
    const _id = typeof id === 'string' ? id : id.id;
    if (json) {
      return Promise.resolve(this.staticFetcher(_id, json, mapper)) as Promise<T | undefined>;
    }
    return Promise.resolve(this.remoteFetcher(_id, {}, mapper)) as Promise<T | undefined>;
  }

  loadSync<T>(id: string | Reference<any>, json: unknown, mapper?: (resource: any) => any): T | undefined {
    const _id = typeof id === 'string' ? id : id.id;
    return this.staticFetcher(_id, json, mapper) as T | undefined;
  }

  loadManifestSync(
    id: string | Reference<any>,
    json: unknown,
    mapper?: (resource: any) => any
  ): ManifestNormalizedV4 | undefined {
    const _id = typeof id === 'string' ? id : id.id;
    return this.loadSync<ManifestNormalizedV4>(_id, json, mapper);
  }

  loadCollectionSync(
    id: string | Reference<any>,
    json: unknown,
    mapper?: (resource: any) => any
  ): CollectionNormalizedV4 | undefined {
    const _id = typeof id === 'string' ? id : id.id;
    return this.loadSync<CollectionNormalizedV4>(_id, json, mapper);
  }

  areInputsEqual(newInputs: readonly unknown[] | unknown, lastInputs: readonly unknown[] | unknown) {
    return areInputsEqual(newInputs, lastInputs);
  }

  subscribe<T>(
    selector: (state: IIIFStore) => T,
    subscription: (state: T, vault: Vault4) => void,
    skipInitial: boolean
  ): () => void;
  subscribe<T>(subscription: (state: T, vault: Vault4) => void, skipInitial?: boolean): () => void;
  subscribe<T>(
    selector: ((state: IIIFStore) => T) | ((state: T, vault: Vault4) => void),
    subscription?: ((state: T, vault: Vault4) => void) | boolean,
    skipInitial?: boolean
  ): () => void {
    if (
      typeof skipInitial === 'undefined' &&
      (typeof subscription === 'undefined' || subscription === false || subscription === true)
    ) {
      skipInitial = subscription;
      subscription = selector as any;
      selector = (a: any) => a;
    }

    return this.store.subscribe(selector as any, (s: any) => (subscription as any)(s, this), {
      equalityFn: areInputsEqual,
      fireImmediately: !skipInitial,
    });
  }

  async ensureLoaded(_id: string | Reference<any>): Promise<void> {
    const id = typeof _id === 'string' ? _id : _id.id;
    if (!this.requestStatus(id)) {
      await this.load(id);
    }
  }

  requestStatus(id: string): RequestState[any] | undefined {
    return this.select<RequestState[any]>((state) => {
      return state.iiif.requests[id];
    });
  }

  // Pagination built on "meta".
  getPaginationState<T = any>(resource: string | Reference): PaginationState | null {
    // This will return the pagination state of a resource from it's meta.
    // If there is no pagination state, it will create it if needed.
    const id = typeof resource === 'string' ? resource : resource.id;
    if (!id) return null;

    const existing = this.getResourceMeta(id, '@vault/pagination');
    if (existing?.state) {
      return existing.state;
    }

    const fullResource = this.get(resource);
    if (fullResource.first) {
      const initialState: PaginationState = {
        currentPage: null,
        currentPageIndex: null,
        isFetching: false,
        isFullyLoaded: false,
        next: fullResource.first,
        page: 1,
        pages: [],
        previous: null,
        totalItems: fullResource.total,
        currentLength: 0,
      };

      this.setMetaValue([id, '@vault/pagination', 'state'], initialState);

      return initialState;
    }

    // @todo generate from resource.

    return null;
  }

  async loadNextPage(
    resource: string | Reference,
    json?: any
  ): Promise<[PaginationState | null, CollectionNormalizedV4 | null]> {
    const id = typeof resource === 'string' ? resource : resource.id;
    if (!id) return [null, null];

    // This will get the pagination state and fetch the next page and load it into the vault.
    const state = this.getPaginationState(resource);
    if (!state || state.isFullyLoaded || !state.next) {
      return [null, null];
    }

    if (state.isFetching) {
      return [state, null];
    }

    const nextPage = typeof state.next === 'string' ? state.next : (state.next as any).id;
    const previousPage = state.currentPage;

    // 1. Update the meta state.
    const newState: PaginationState = {
      ...state,
      isFetching: true,
    };
    this.setMetaValue([id, '@vault/pagination', 'state'], newState);

    // 2. Make the fetch request.
    let collectionPage;
    try {
      collectionPage = await this.loadCollection(nextPage, json, (mapped) => {
        // This is required because the page MIGHT have the same id.
        const { id, ['@id']: _id, ...properties } = mapped || {};

        if (_id) {
          return { ['@id']: nextPage, ...properties };
        }

        return { id: nextPage, ...properties };
      });
    } catch (err) {
      const errState: PaginationState = {
        ...state,
        isFetching: false,
        error: err,
      };
      this.setMetaValue([id, '@vault/pagination', 'state'], errState);
      return [errState, null];
    }

    if (!collectionPage) {
      const errState: PaginationState = {
        ...state,
        isFetching: false,
        error: new Error('Collection not found'),
      };
      this.setMetaValue([id, '@vault/pagination', 'state'], errState);
      return [errState, null];
    }

    const fullCollection = this.get(id);
    const combinedItems = [...(fullCollection.items || []), ...(collectionPage.items || [])].map((resource) => ({
      id: resource.id,
      type: resource.type,
    }));

    this.modifyEntityField({ id, type: 'Collection' }, 'items', combinedItems);
    const latestState = this.getPaginationState(resource);
    if (!latestState) throw new Error('Pagination state not found');
    const successState: PaginationState = {
      ...latestState,
      isFetching: false,
      error: null,
      currentPage: (collectionPage.id || null) as string | null,
      next: (collectionPage as any).next?.id || null,
      currentPageIndex: latestState.pages.length,
      currentLength: combinedItems.length,
      pages: [
        ...latestState.pages,
        {
          id: collectionPage.id as string,
          type: 'Collection',
          startIndex: (fullCollection.items || []).length,
          pageLength: collectionPage.items.length,
          order: typeof latestState.currentPageIndex === 'number' ? latestState.currentPageIndex + 1 : 0,
        },
      ],
      isFullyLoaded: !(collectionPage as any).next,
      previous: previousPage,
      page: latestState.pages.length + 1,
    };

    this.setMetaValue([id, '@vault/pagination', 'state'], successState);

    return [successState, collectionPage];
  }

  getResourceMeta<T = any>(resource: string): Partial<T> | undefined;
  getResourceMeta<T = any, Key extends keyof T = keyof T>(resource: string, metaKey: Key): T[Key] | undefined;
  getResourceMeta<T = any, Key extends keyof T = keyof T>(
    resource: string,
    metaKey?: Key
  ): Partial<T> | T[Key] | undefined {
    const resourceMeta = this.getState().iiif.meta[resource as any] as any;

    if (!resourceMeta) {
      return undefined;
    }
    if (!metaKey) {
      return resourceMeta as Partial<T>;
    }

    return resourceMeta[metaKey] as T[Key];
  }

  getObject<R extends { type?: string }>(
    reference: string | Partial<R>,
    type?: string | GetObjectOptions,
    options?: GetObjectOptions
  ): RefToNormalizedV4<R>;
  getObject<R extends { type?: string }>(
    reference: string | R | NormalizedEntity,
    type?: string | GetObjectOptions,
    options: GetObjectOptions = {}
  ): RefToNormalizedV4<R> {
    const { reactive, ...otherOptions } = options;
    return wrapObject(this.get(reference as any, type, otherOptions), this as any, reactive) as any;
  }

  async loadObject<Type, NormalizedType = any>(
    id: string | Reference<any>,
    json?: any
  ): Promise<ReactiveWrapped<Type, NormalizedType>> {
    return wrapObject<Type, NormalizedType>(await this.load(id, json), this as any);
  }
  async loadManifestObject(
    id: string | Reference<any>,
    json?: any
  ): Promise<ReactiveWrapped<Manifest, ManifestNormalizedV4>> {
    return wrapObject<Manifest, ManifestNormalizedV4>(await this.loadManifest(id, json), this as any);
  }
  async loadCollectionObject(
    id: string | Reference<any>,
    json?: any
  ): Promise<ReactiveWrapped<Collection, CollectionNormalizedV4>> {
    return wrapObject<Collection, CollectionNormalizedV4>(await this.loadCollection(id, json), this as any);
  }
  wrapObject<T extends string>(objectType: Reference<T>) {
    return wrapObject(this.get(objectType, { skipSelfReturn: false }), this as any);
  }
  isWrapped(object: any) {
    return isWrapped(object);
  }
  setMetaValue<Value = any>(
    [id, meta, key]: [string, string, string],
    newValueOrUpdate: Value | ((oldValue: Value | undefined) => Value)
  ) {
    this.dispatch(
      typeof newValueOrUpdate === 'function'
        ? metaActions.setMetaValueDynamic({
            id,
            meta: meta as any,
            key,
            updateValue: newValueOrUpdate as any,
          })
        : metaActions.setMetaValue({
            id,
            meta: meta as any,
            key,
            value: newValueOrUpdate,
          })
    );
  }
}
