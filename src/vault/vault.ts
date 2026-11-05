/// <reference types="geojson" />

import {
  frameResource,
  HAS_PART,
  isSpecificResource,
  PART_OF,
  type SerializeConfig,
  serialize,
  serializeConfigPresentation2,
  serializeConfigPresentation3,
} from "@iiif/parser";
import type { Collection, Manifest, Reference, SpecificResource } from "@iiif/parser/presentation-3/types";
import type {
  AnnotationCollectionNormalized,
  AnnotationNormalized,
  AnnotationPageNormalized,
  CanvasNormalized,
  CollectionNormalized,
  ManifestNormalized,
  RangeNormalized,
  ResourceProviderNormalized,
  ServiceNormalized,
} from "@iiif/parser/presentation-3-normalized/types";
import mitt, { type Emitter } from "mitt";
import { BATCH_ACTIONS, batchActions, entityActions, metaActions } from "./actions";
import { createStore, type VaultZustandStore } from "./store";
import { VaultHistory, historyId } from "./history/history";
import type {
  DispatchOptions,
  HistoryOptions,
  HistoryResult,
  VaultAction,
  VaultCommit,
  VaultInteraction,
} from "./history/types";
import type {
  ActionFromType,
  AllActions,
  Entities,
  IIIFStore,
  NormalizedEntity,
  PaginationPageNormalized,
  PaginationState,
  RefToNormalized,
  RequestState,
  VaultLoadReport,
} from "./types";
import { areInputsEqual, createFetchHelper } from "./utility";
import { type ActionListFromResource, actionListFromResourceV3 } from "./utility/action-list-from-resource";
import { defaultFetcher } from "./utility/default-fetcher";
import { isWrapped, type ReactiveWrapped, wrapObject } from "./utility/objects";
import { resolveType } from "./utility/resolve-type";

export type VaultOptions = {
  reducers: Record<string, any>;
  history?: boolean | HistoryOptions;
  defaultState?: IIIFStore;
  customFetcher: <T>(url: string, options: T) => unknown | Promise<unknown>;
  enableDevtools: boolean;
};

export type GetOptions = {
  skipSelfReturn?: boolean;
  parent?: Reference<any> | string;
  preserveSpecificResources?: boolean;
  skipPartOfCheck?: boolean;
};
export type GetObjectOptions = GetOptions & { reactive?: boolean };

type AllActionsType = Extract<AllActions["type"], string>;

export type EntityRef<Ref extends keyof Entities> = IIIFStore["iiif"]["entities"][Ref][string];

function referenceId(reference: unknown): string | null {
  if (typeof reference === "string") {
    return reference;
  }
  if (reference && typeof reference === "object" && typeof (reference as any).id === "string") {
    return (reference as any).id;
  }
  return null;
}

function uniqueReferences(references: any[]): Array<{ id: string; type: string }> {
  const seen = new Set<string>();
  const unique: Array<{ id: string; type: string }> = [];
  for (const reference of references) {
    if (!reference || typeof reference.id !== "string" || typeof reference.type !== "string") {
      continue;
    }
    const key = `${reference.type}\0${reference.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({ id: reference.id, type: reference.type });
    }
  }
  return unique;
}

export type VaultTypeMap = {
  Manifest: unknown;
  Collection: unknown;
  ManifestNormalized: unknown;
  CollectionNormalized: unknown;
  Normalized?: object;
};

export type Vault3TypeMap = {
  Manifest: Manifest;
  Collection: Collection;
  ManifestNormalized: ManifestNormalized;
  CollectionNormalized: CollectionNormalized;
  Normalized: {
    Manifest: ManifestNormalized;
    Collection: CollectionNormalized;
    Canvas: CanvasNormalized;
    AnnotationPage: AnnotationPageNormalized;
    AnnotationCollection: AnnotationCollectionNormalized;
    Annotation: AnnotationNormalized;
    Range: RangeNormalized;
    Service: ServiceNormalized;
    Agent: ResourceProviderNormalized;
  };
};

export type RefToNormalizedFor<Ref extends { type?: string }, Types extends VaultTypeMap> = Ref["type"] extends string
  ? Ref["type"] extends keyof NonNullable<Types["Normalized"]>
    ? NonNullable<Types["Normalized"]>[Ref["type"]]
    : RefToNormalized<Ref>
  : RefToNormalized<Ref>;

export class Vault<Types extends VaultTypeMap = Vault3TypeMap> {
  readonly presentationVersion: 3 | 4 = 3;
  protected readonly options: VaultOptions;
  private readonly store: VaultZustandStore;
  private readonly emitter: Emitter<any>;
  readonly history?: VaultHistory;
  private batchFrames: Array<{ actions: VaultAction[]; options: DispatchOptions }> = [];
  private dispatchContext: DispatchOptions = {};
  private contextGuard?: () => void;
  private epoch = 0;
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
        customFetcher: defaultFetcher,
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
    if (this.options.history) {
      this.history = new VaultHistory(this.store, this.options.history === true ? {} : this.options.history);
      this.dispatchContext = { actorId: this.history.actorId, sessionId: this.history.sessionId };
    }
    this.store.onReset((phase) => {
      if (phase === "before") this.epoch++;
    });
    this.remoteFetcher = createFetchHelper(this as Vault<any>, this.options.customFetcher || defaultFetcher, {
      actionListFromResource: this.getActionListFromResource(),
    }) as any;
    this.staticFetcher = createFetchHelper(this as Vault<any>, (id: string, json: any) => json, {
      actionListFromResource: this.getActionListFromResource(),
    });
  }

  protected getActionListFromResource(): ActionListFromResource {
    return actionListFromResourceV3;
  }

  defaultFetcher = defaultFetcher;

  /** Nested batches are savepoints. Only the outer successful batch publishes. */
  batch(cb: (vault: this) => void) {
    this.contextGuard?.();
    const frame = { actions: [] as VaultAction[], options: { ...this.dispatchContext } };
    const epoch = this.epoch;
    this.batchFrames.push(frame);
    try {
      const result: unknown = cb(this);
      if (epoch !== this.epoch) throw new Error("Vault state was replaced during a batch");
      if (result && typeof (result as any).then === "function") {
        throw new Error("Use asyncBatch with its scoped Vault for asynchronous work");
      }
    } catch (error) {
      this.batchFrames.pop();
      throw error;
    }
    this.batchFrames.pop();
    if (frame.actions.length) this.dispatch(batchActions({ actions: frame.actions }), frame.options);
  }

  /** Only calls through the callback's scoped Vault are queued across awaits. */
  async asyncBatch(cb: (vault: this) => Promise<void> | void) {
    const scope = this.createScope(this.dispatchContext);
    const frame = { actions: [] as VaultAction[], options: { ...this.dispatchContext } };
    scope.vault.batchFrames.push(frame);
    try {
      await cb(scope.vault);
      scope.vault.contextGuard?.();
      if (frame.actions.length) this.dispatch(batchActions({ actions: frame.actions }), frame.options);
    } finally {
      scope.close();
    }
  }

  /** An interaction groups committed mutations without delaying reads or capturing unrelated work. */
  beginInteraction(options: Pick<DispatchOptions, "label" | "history"> = {}): VaultInteraction<this> {
    this.contextGuard?.();
    const ownsGroup = !this.dispatchContext.groupId;
    const id = this.dispatchContext.groupId || this.history?.openGroup(options) || historyId();
    const scope = this.createScope({
      ...this.dispatchContext,
      ...options,
      groupId: id,
      history: options.history ?? this.dispatchContext.history ?? "record",
    });
    const finish = () => {
      scope.close();
      if (ownsGroup) this.history?.closeGroup(id);
    };
    return { id, vault: scope.vault, finish, cancel: finish };
  }

  async interaction<T>(
    options: Pick<DispatchOptions, "label" | "history">,
    cb: (vault: this) => T | Promise<T>
  ): Promise<T> {
    const context = this.beginInteraction(options);
    try {
      return await cb(context.vault);
    } finally {
      context.finish();
    }
  }

  private createScope(options: DispatchOptions) {
    let active = true;
    const epoch = this.epoch;
    const guard = this.contextGuard;
    const vault: this = Object.create(this);
    vault.batchFrames = [];
    vault.dispatchContext = { ...options };
    vault.contextGuard = () => {
      guard?.();
      if (
        !active ||
        epoch !== this.epoch ||
        (options.groupId && this.history && !this.history.isOpen(options.groupId))
      ) {
        throw new Error("Vault interaction is closed, expired or belongs to replaced state");
      }
    };
    vault.remoteFetcher = createFetchHelper(vault as Vault<any>, this.options.customFetcher || defaultFetcher, {
      actionListFromResource: this.getActionListFromResource(),
    }) as any;
    vault.staticFetcher = createFetchHelper(vault as Vault<any>, (id: string, json: any) => json, {
      actionListFromResource: this.getActionListFromResource(),
    });
    return {
      vault,
      close: () => {
        active = false;
      },
    };
  }

  undo(): HistoryResult {
    return this.history?.undo() ?? { ok: false, reason: "disabled" };
  }
  redo(): HistoryResult {
    return this.history?.redo() ?? { ok: false, reason: "disabled" };
  }

  subscribeCommits(listener: (commit: VaultCommit) => void): () => void {
    return this.store.subscribeCommits(listener);
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

  dispatch(action: VaultAction, options: DispatchOptions = {}) {
    this.contextGuard?.();
    const context = { ...this.dispatchContext, ...options };
    const frame = this.batchFrames[this.batchFrames.length - 1];
    if (frame) {
      for (const key of ["actorId", "sessionId", "groupId", "history"] as const) {
        if (context[key] !== frame.options[key]) throw new Error("Cannot mix dispatch contexts in a Vault batch");
      }
      frame.actions.push(action);
      return;
    }
    const actions: VaultAction[] = [];
    const flatten = (item: VaultAction) => {
      if (item.type === BATCH_ACTIONS) item.payload.actions.forEach(flatten);
      else actions.push(item);
    };
    flatten(action);
    if (!actions.length) return;
    for (const item of actions) this.emitter.emit(item.type, { action: item, state: this.store.getState() });
    this.store.dispatch(action, context);
    const state = this.store.getState();
    for (const item of actions) this.emitter.emit(`after:${item.type}`, { action: item, state });
  }

  on<Type extends AllActionsType>(
    event: Type | `after:${Type}`,
    handler: (ctx: { action: ActionFromType<Type>; state: IIIFStore }) => void
  ) {
    this.emitter.on(event, handler);
    return () => {
      this.emitter.off(event, handler);
    };
  }

  serialize<Return>(entity: Reference<keyof Entities>, config: SerializeConfig) {
    return serialize<Return>(this.getState().iiif, entity, config);
  }

  toPresentation2<Return>(entity: Reference<keyof Entities>) {
    return this.serialize<Return>(entity, serializeConfigPresentation2);
  }

  toPresentation3<Return>(entity: Reference<keyof Entities>) {
    return this.serialize<Return>(entity, serializeConfigPresentation3);
  }

  hydrate<R extends { type?: string }>(
    reference: string | Partial<R>,
    type?: string | GetOptions,
    options?: GetOptions
  ): RefToNormalizedFor<R, Types>;
  hydrate<R extends { type?: string }>(
    reference: string[] | Partial<R>[],
    type?: string | GetOptions,
    options?: GetOptions
  ): RefToNormalizedFor<R, Types>[];
  hydrate<R extends { type?: string }>(
    reference: string | R | NormalizedEntity | string[] | R[] | NormalizedEntity[],
    type?: string | GetOptions,
    options: GetOptions = {}
  ): RefToNormalizedFor<R, Types> | RefToNormalizedFor<R, Types>[] {
    return this.get<R>(reference as any, type as any, {
      ...options,
      skipSelfReturn: false,
    });
  }

  get<R extends { type?: string }>(
    reference: string | Partial<R> | Reference<R["type"]> | SpecificResource<R>,
    type?: string | GetOptions,
    options?: GetOptions
  ): RefToNormalizedFor<R, Types>;
  get<R extends { type?: string }>(
    reference: string[] | Partial<R>[] | Reference<R["type"]>[] | SpecificResource<R>[],
    type?: string | GetOptions,
    options?: GetOptions
  ): RefToNormalizedFor<R, Types>[];
  get<R extends { type?: string }>(
    reference:
      | string
      | R
      | NormalizedEntity
      | string[]
      | R[]
      | NormalizedEntity[]
      | SpecificResource<R>
      | SpecificResource<R>[],
    type?: string | GetOptions,
    options: GetOptions = {}
  ): RefToNormalizedFor<R, Types> | RefToNormalizedFor<R, Types>[] {
    if (typeof type !== "string") {
      options = type || {};
      type = undefined;
    }

    const { skipSelfReturn = true } = options || {};
    let parent = options.parent ? (typeof options.parent === "string" ? options.parent : options.parent.id) : undefined;

    // Multiples.
    if (Array.isArray(reference)) {
      return (reference as any[]).map((i) => this.get(i, options)) as EntityRef<any>[];
    }

    const state = this.getState();

    if (isSpecificResource(reference) && !options.preserveSpecificResources) {
      reference = reference.source;
    }

    // String IDs.
    if (typeof reference === "string") {
      const _type: any = resolveType(type ? type : state.iiif.mapping[reference]);
      if (!_type) {
        if (skipSelfReturn) {
          return null as any;
        }
        return { id: reference, type: "unknown" } as any;
      }
      reference = { id: reference, type: _type };
    }

    if (reference && (reference as any).partOf && !parent && !options.skipPartOfCheck) {
      const first = Array.isArray((reference as any).partOf) ? (reference as any).partOf[0] : (reference as any).partOf;
      if (first) {
        if (typeof first === "string") {
          parent = first;
        }
        if (typeof first.id === "string") {
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
        return this.get(request.resourceUri, options) as any;
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
    if (typeof input === "undefined") {
      return this.get(prev, { skipSelfReturn: false });
    }
    if (typeof input === "function") {
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
  ): Promise<Types["ManifestNormalized"] | undefined> {
    const _id = typeof id === "string" ? id : id.id;
    return this.load<Types["ManifestNormalized"]>(_id, json, mapper);
  }

  loadCollection(
    id: string | Reference<any>,
    json?: unknown,
    mapper?: (resource: any) => any
  ): Promise<Types["CollectionNormalized"] | undefined> {
    const _id = typeof id === "string" ? id : id.id;
    return this.load<Types["CollectionNormalized"]>(_id, json, mapper);
  }

  load<T>(id: string | Reference<any>, json?: unknown, mapper?: (resource: any) => any): Promise<T | undefined> {
    const _id = typeof id === "string" ? id : id.id;
    if (json) {
      return Promise.resolve(this.staticFetcher(_id, json, mapper)) as Promise<T | undefined>;
    }
    return Promise.resolve(this.remoteFetcher(_id, {}, mapper)) as Promise<T | undefined>;
  }

  loadSync<T>(id: string | Reference<any>, json: unknown, mapper?: (resource: any) => any): T | undefined {
    const _id = typeof id === "string" ? id : id.id;
    return this.staticFetcher(_id, json, mapper) as T | undefined;
  }

  loadManifestSync(
    id: string | Reference<any>,
    json: unknown,
    mapper?: (resource: any) => any
  ): Types["ManifestNormalized"] | undefined {
    const _id = typeof id === "string" ? id : id.id;
    return this.loadSync<Types["ManifestNormalized"]>(_id, json, mapper);
  }

  loadCollectionSync(
    id: string | Reference<any>,
    json: unknown,
    mapper?: (resource: any) => any
  ): Types["CollectionNormalized"] | undefined {
    const _id = typeof id === "string" ? id : id.id;
    return this.loadSync<Types["CollectionNormalized"]>(_id, json, mapper);
  }

  areInputsEqual(newInputs: readonly unknown[] | unknown, lastInputs: readonly unknown[] | unknown) {
    return areInputsEqual(newInputs, lastInputs);
  }

  subscribe<T>(
    selector: (state: IIIFStore) => T,
    subscription: (state: T, vault: this) => void,
    skipInitial: boolean
  ): () => void;
  subscribe<T>(subscription: (state: T, vault: this) => void, skipInitial?: boolean): () => void;
  subscribe<T>(
    selector: ((state: IIIFStore) => T) | ((state: T, vault: this) => void),
    subscription?: ((state: T, vault: this) => void) | boolean,
    skipInitial?: boolean
  ): () => void {
    if (
      typeof skipInitial === "undefined" &&
      (typeof subscription === "undefined" || subscription === false || subscription === true)
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
    const id = typeof _id === "string" ? _id : _id.id;
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
    const id = typeof resource === "string" ? resource : resource.id;
    if (!id) return null;

    const existing = this.getResourceMeta(id, "@vault/pagination");
    if (existing?.state) {
      return existing.state;
    }

    const fullResource: any = this.get(resource);
    if (fullResource?.first) {
      const firstPage = referenceId(fullResource.first);
      if (!firstPage) {
        return null;
      }
      const initialState: PaginationState = {
        currentPage: null,
        currentPageIndex: null,
        isFetching: false,
        isFullyLoaded: false,
        next: firstPage,
        page: 1,
        pages: [],
        previous: null,
        totalItems: fullResource.total,
        currentLength: 0,
      };

      this.setMetaValue([id, "@vault/pagination", "state"], initialState);

      return initialState;
    }

    // @todo generate from resource.

    return null;
  }

  async loadNextPage(
    resource: string | Reference,
    json?: any
  ): Promise<[PaginationState | null, PaginationPageNormalized | null]> {
    const id = typeof resource === "string" ? resource : resource.id;
    if (!id) return [null, null];

    // This will get the pagination state and fetch the next page and load it into the vault.
    const state = this.getPaginationState(resource);
    if (!state || state.isFullyLoaded || !state.next) {
      return [null, null];
    }

    if (state.isFetching) {
      return [state, null];
    }

    const nextPage = referenceId(state.next);
    if (!nextPage) {
      const errState: PaginationState = {
        ...state,
        isFetching: false,
        isFullyLoaded: true,
        error: new Error("Page reference does not have an id"),
      };
      this.setMetaValue([id, "@vault/pagination", "state"], errState);
      return [errState, null];
    }

    if (state.currentPage === nextPage || state.pages.some((page) => page.id === nextPage)) {
      const errState: PaginationState = {
        ...state,
        isFetching: false,
        isFullyLoaded: true,
        error: new Error(`Pagination cycle detected at ${nextPage}`),
      };
      this.setMetaValue([id, "@vault/pagination", "state"], errState);
      return [errState, null];
    }
    const previousPage = state.currentPage;
    const paginatedResourceBeforeLoad: any = this.get(id);

    // 1. Update the meta state.
    const newState: PaginationState = {
      ...state,
      isFetching: true,
    };
    this.setMetaValue([id, "@vault/pagination", "state"], newState);

    // 2. Make the fetch request.
    let page;
    try {
      page = await this.load<PaginationPageNormalized>(nextPage, json, (mapped) => {
        // This is required because the page MIGHT have the same id.
        const { id, ["@id"]: _id, ...properties } = mapped || {};

        if (_id) {
          return { ["@id"]: nextPage, ...properties };
        }

        return { id: nextPage, ...properties };
      });
    } catch (err) {
      const errState: PaginationState = {
        ...state,
        isFetching: false,
        error: err,
      };
      this.setMetaValue([id, "@vault/pagination", "state"], errState);
      return [errState, null];
    }

    if (!page) {
      const errState: PaginationState = {
        ...state,
        isFetching: false,
        error: new Error(`Page not found: ${nextPage}`),
      };
      this.setMetaValue([id, "@vault/pagination", "state"], errState);
      return [errState, null];
    }

    const typedPage: any = page;
    this.dispatch(
      entityActions.importEntities({
        entities: {
          [paginatedResourceBeforeLoad.type]: {
            [id]: paginatedResourceBeforeLoad,
          },
        },
      })
    );
    const expectedPageType =
      paginatedResourceBeforeLoad.type === "AnnotationCollection"
        ? "AnnotationPage"
        : referenceId(paginatedResourceBeforeLoad.first) === nextPage &&
            (paginatedResourceBeforeLoad.first as any)?.type
          ? (paginatedResourceBeforeLoad.first as any).type
          : undefined;
    if (
      (expectedPageType === "AnnotationPage" && typedPage.type !== "AnnotationPage") ||
      (paginatedResourceBeforeLoad.type === "Collection" && !["Collection", "CollectionPage"].includes(typedPage.type))
    ) {
      const errState: PaginationState = {
        ...state,
        isFetching: false,
        error: new Error(`Expected ${expectedPageType || "collection"} page, received ${typedPage.type || "unknown"}`),
      };
      this.setMetaValue([id, "@vault/pagination", "state"], errState);
      return [errState, null];
    }

    const existingItems = this.getPaginatedItems(resource);
    const pageItems = typedPage.items || [];
    const combinedItems = uniqueReferences([...existingItems, ...pageItems]);
    if (typedPage.type === "Collection") {
      this.modifyEntityField({ id, type: paginatedResourceBeforeLoad.type }, "items", combinedItems);
    }
    const latestState = this.getPaginationState(resource);
    if (!latestState) throw new Error("Pagination state not found");
    const next = referenceId(typedPage.next);
    const successState: PaginationState = {
      ...latestState,
      isFetching: false,
      error: null,
      currentPage: typedPage.id || null,
      next,
      currentPageIndex: latestState.pages.length,
      currentLength: combinedItems.length,
      pages: [
        ...latestState.pages,
        {
          id: typedPage.id,
          type: typedPage.type,
          startIndex: typeof typedPage.startIndex === "number" ? typedPage.startIndex : existingItems.length,
          pageLength: pageItems.length,
          order: typeof latestState.currentPageIndex === "number" ? latestState.currentPageIndex + 1 : 0,
        },
      ],
      isFullyLoaded: !next,
      previous: previousPage,
      page: latestState.pages.length + 1,
    };

    this.setMetaValue([id, "@vault/pagination", "state"], successState);

    return [successState, page];
  }

  getPaginatedItems(resource: string | Reference): Array<{ id: string; type: string }> {
    const state = this.getPaginationState(resource);
    if (!state) {
      return [];
    }
    return uniqueReferences(
      state.pages.flatMap((page) => {
        const loadedPage: any = this.get({ id: page.id, type: page.type });
        return loadedPage?.items || [];
      })
    );
  }

  async loadPageChain(resource: string | Reference): Promise<PaginationState | null> {
    let state = this.getPaginationState(resource);
    while (state && !state.isFullyLoaded && state.next && !state.error) {
      [state] = await this.loadNextPage(resource);
    }
    return state;
  }

  getLoadReport(resource: string | Reference): VaultLoadReport | undefined {
    const id = typeof resource === "string" ? resource : resource.id;
    return this.getResourceMeta<{ "@vault/load": { report: VaultLoadReport } }>(id, "@vault/load")?.report;
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
  ): RefToNormalizedFor<R, Types>;
  getObject<R extends { type?: string }>(
    reference: string | R | NormalizedEntity,
    type?: string | GetObjectOptions,
    options: GetObjectOptions = {}
  ): RefToNormalizedFor<R, Types> {
    const { reactive, ...otherOptions } = options;
    return wrapObject(this.get(reference as any, type, otherOptions), this as Vault<any>, reactive) as any;
  }

  async loadObject<Type, NormalizedType = any>(
    id: string | Reference<any>,
    json?: any
  ): Promise<ReactiveWrapped<Type, NormalizedType>> {
    return wrapObject<Type, NormalizedType>(await this.load(id, json), this as Vault<any>);
  }
  async loadManifestObject(
    id: string | Reference<any>,
    json?: any
  ): Promise<ReactiveWrapped<Types["Manifest"], Types["ManifestNormalized"]>> {
    return wrapObject<Types["Manifest"], Types["ManifestNormalized"]>(
      await this.loadManifest(id, json),
      this as Vault<any>
    );
  }
  async loadCollectionObject(
    id: string | Reference<any>,
    json?: any
  ): Promise<ReactiveWrapped<Types["Collection"], Types["CollectionNormalized"]>> {
    return wrapObject<Types["Collection"], Types["CollectionNormalized"]>(
      await this.loadCollection(id, json),
      this as Vault<any>
    );
  }
  wrapObject<T extends string>(objectType: Reference<T>) {
    return wrapObject(this.get(objectType, { skipSelfReturn: false }), this as Vault<any>);
  }
  isWrapped(object: any) {
    return isWrapped(object);
  }
  setMetaValue<Value = any>(
    [id, meta, key]: [string, string, string],
    newValueOrUpdate: Value | ((oldValue: Value | undefined) => Value)
  ) {
    this.dispatch(
      typeof newValueOrUpdate === "function"
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
