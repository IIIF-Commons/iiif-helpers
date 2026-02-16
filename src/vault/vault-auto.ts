import type { Collection, Manifest, Reference, SpecificResource } from '@iiif/parser/presentation-3/types';
import type { CollectionNormalized, ManifestNormalized } from '@iiif/parser/presentation-3-normalized/types';
import type { BatchAction } from './actions';
import type { ActionFromType, AllActions, Entities, IIIFStore, NormalizedEntity, PaginationState, RefToNormalized, RequestState } from './types';
import { VaultZustandStore } from './store';
import type { ReactiveWrapped } from './utility/objects';
import { Vault, type GetObjectOptions, type GetOptions, type VaultOptions } from './vault';
import { Vault3 } from './vault3';
import { Vault4 } from './vault4';
import { SerializeConfig } from '@iiif/parser';

type VaultAutoLoadJournalEntry = {
  id: string;
  resource: unknown;
};

export type VaultAutoOptions = Partial<VaultOptions> & {
  enablePresentation4?: boolean;
  switchOnScene?: boolean;
  onVersionSwitch?: (from: 3, to: 4, context: { triggerId: string }) => void;
};

function cloneForReplay<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function hasSceneResource(input: unknown): boolean {
  const seen = new Set<unknown>();
  const queue: unknown[] = [input];

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== 'object') {
      continue;
    }
    if (seen.has(current)) {
      continue;
    }
    seen.add(current);

    if ((current as any).type === 'Scene') {
      return true;
    }

    if (Array.isArray(current)) {
      for (const item of current) {
        queue.push(item);
      }
      continue;
    }

    for (const value of Object.values(current as Record<string, unknown>)) {
      queue.push(value);
    }
  }

  return false;
}

export class VaultAuto {
  private readonly options: Required<Pick<VaultAutoOptions, 'enablePresentation4' | 'switchOnScene'>> &
    Omit<VaultAutoOptions, 'enablePresentation4' | 'switchOnScene'>;
  private readonly vaultOptions: Partial<VaultOptions>;
  private readonly fetcher: <T>(url: string, options: T) => unknown | Promise<unknown>;
  private readonly vault3: Vault3;
  private vault4Internal?: Vault4;
  private activeVault: Vault3 | Vault4;
  private loadJournal: VaultAutoLoadJournalEntry[] = [];

  constructor(options?: VaultAutoOptions) {
    const {
      enablePresentation4 = false,
      switchOnScene = true,
      onVersionSwitch,
      reducers,
      defaultState,
      customFetcher,
      enableDevtools,
    } = options || {};

    this.options = {
      enablePresentation4,
      switchOnScene,
      onVersionSwitch,
      reducers,
      defaultState,
      customFetcher,
      enableDevtools,
    };

    this.vaultOptions = {
      reducers,
      defaultState,
      customFetcher,
      enableDevtools,
    };

    this.fetcher = customFetcher || this.defaultFetcher;
    this.vault3 = new Vault3(this.vaultOptions);
    this.activeVault = this.vault3;
  }

  get v4(): Vault4 | undefined {
    return this.vault4Internal;
  }

  getVersion(): 3 | 4 {
    return this.vault4Internal ? 4 : 3;
  }

  isPresentation4(): boolean {
    return this.getVersion() === 4;
  }

  private getVault(): Vault3 | Vault4 {
    return this.activeVault;
  }

  private defaultFetcher = (url: string) => {
    return fetch(url).then((r) => {
      if (r.status === 200) {
        return r.json();
      }
      const err = new Error(`${r.status} ${r.statusText}`);
      err.name = `HTTPError`;
      throw err;
    });
  };

  private shouldUseAutoLoadPath(): boolean {
    return this.options.enablePresentation4 && !this.vault4Internal;
  }

  private pushToJournal(id: string, resource: unknown) {
    this.loadJournal.push({
      id,
      resource: cloneForReplay(resource),
    });
  }

  private maybeSwitchToV4(id: string, resource: unknown) {
    if (!this.options.enablePresentation4 || !this.options.switchOnScene || this.vault4Internal) {
      return;
    }
    if (!hasSceneResource(resource)) {
      return;
    }
    this.switchToV4(id);
  }

  private switchToV4(triggerId: string) {
    if (this.vault4Internal) {
      this.activeVault = this.vault4Internal;
      return;
    }

    const nextVault = new Vault4(this.vaultOptions);
    for (const loaded of this.loadJournal) {
      nextVault.loadSync(loaded.id, cloneForReplay(loaded.resource));
    }

    this.vault4Internal = nextVault;
    this.activeVault = nextVault;
    if (this.options.onVersionSwitch) {
      this.options.onVersionSwitch(3, 4, { triggerId });
    }
  }

  batch(cb: (vault: any) => void) {
    return this.getVault().batch(cb as any);
  }

  async asyncBatch(cb: (vault: any) => Promise<void> | void) {
    return this.getVault().asyncBatch(cb as any);
  }

  modifyEntityField(entity: Reference<keyof Entities>, key: string, value: any) {
    return this.getVault().modifyEntityField(entity, key, value);
  }

  dispatch(action: AllActions | BatchAction) {
    return this.getVault().dispatch(action);
  }

  on<Type extends AllActions['type']>(
    event: Type | `after:${Type}`,
    handler: (ctx: { action: ActionFromType<Type>; state: IIIFStore }) => void
  ) {
    return this.getVault().on(event, handler);
  }

  serialize<Return>(entity: Reference<keyof Entities>, config: SerializeConfig) {
    return this.getVault().serialize<Return>(entity, config);
  }

  toPresentation2<Return>(entity: Reference<keyof Entities>) {
    return this.getVault().toPresentation2<Return>(entity);
  }

  toPresentation3<Return>(entity: Reference<keyof Entities>) {
    return this.getVault().toPresentation3<Return>(entity);
  }

  hydrate<R extends { type?: string }>(
    reference: string | R | NormalizedEntity | string[] | R[] | NormalizedEntity[],
    type?: string | GetOptions,
    options?: GetOptions
  ): RefToNormalized<R> | RefToNormalized<R>[] {
    return this.getVault().hydrate(reference as any, type as any, options);
  }

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
    options?: GetOptions
  ): RefToNormalized<R> | RefToNormalized<R>[] {
    return this.getVault().get(reference as any, type as any, options as any);
  }

  select<R>(selector: (state: IIIFStore) => R): R {
    return this.getVault().select(selector);
  }

  getStore(): VaultZustandStore {
    return this.getVault().getStore();
  }

  getState(): IIIFStore {
    return this.getVault().getState();
  }

  deep(input?: any, prev?: any) {
    return this.getVault().deep(input, prev);
  }

  loadManifest(
    id: string | Reference<any>,
    json?: unknown,
    mapper?: (resource: any) => any
  ): Promise<ManifestNormalized | undefined> {
    const _id = typeof id === 'string' ? id : id.id;
    return this.load<ManifestNormalized>(_id, json, mapper);
  }

  loadCollection(
    id: string | Reference<any>,
    json?: unknown,
    mapper?: (resource: any) => any
  ): Promise<CollectionNormalized | undefined> {
    const _id = typeof id === 'string' ? id : id.id;
    return this.load<CollectionNormalized>(_id, json, mapper);
  }

  async load<T>(id: string | Reference<any>, json?: unknown, mapper?: (resource: any) => any): Promise<T | undefined> {
    const _id = typeof id === 'string' ? id : id.id;

    if (!this.shouldUseAutoLoadPath()) {
      return this.getVault().load<T>(_id, json, mapper);
    }

    if (typeof json === 'undefined') {
      const remote = await this.fetcher(_id, {});
      return this.loadSync<T>(_id, remote, mapper);
    }

    return this.loadSync<T>(_id, json, mapper);
  }

  loadSync<T>(id: string | Reference<any>, json: unknown, mapper?: (resource: any) => any): T | undefined {
    const _id = typeof id === 'string' ? id : id.id;

    if (!this.shouldUseAutoLoadPath()) {
      return this.getVault().loadSync<T>(_id, json, mapper);
    }

    const mapped = mapper ? mapper(json) : json;
    this.pushToJournal(_id, mapped);
    this.maybeSwitchToV4(_id, mapped);

    return this.getVault().loadSync<T>(_id, mapped);
  }

  loadManifestSync(
    id: string | Reference<any>,
    json: unknown,
    mapper?: (resource: any) => any
  ): ManifestNormalized | undefined {
    const _id = typeof id === 'string' ? id : id.id;
    return this.loadSync<ManifestNormalized>(_id, json, mapper);
  }

  loadCollectionSync(
    id: string | Reference<any>,
    json: unknown,
    mapper?: (resource: any) => any
  ): CollectionNormalized | undefined {
    const _id = typeof id === 'string' ? id : id.id;
    return this.loadSync<CollectionNormalized>(_id, json, mapper);
  }

  areInputsEqual(newInputs: readonly unknown[] | unknown, lastInputs: readonly unknown[] | unknown) {
    return this.getVault().areInputsEqual(newInputs, lastInputs);
  }

  subscribe<T>(
    selector: (state: IIIFStore) => T,
    subscription: (state: T, vault: Vault) => void,
    skipInitial?: boolean
  ): () => void;
  subscribe<T>(subscription: (state: T, vault: Vault) => void, skipInitial?: boolean): () => void;
  subscribe<T>(
    selector: ((state: IIIFStore) => T) | ((state: T, vault: Vault) => void),
    subscription?: ((state: T, vault: Vault) => void) | boolean,
    skipInitial?: boolean
  ): () => void {
    return (this.getVault() as any).subscribe(selector as any, subscription as any, skipInitial as any);
  }

  async ensureLoaded(_id: string | Reference<any>): Promise<void> {
    return this.getVault().ensureLoaded(_id);
  }

  requestStatus(id: string): RequestState[any] | undefined {
    return this.getVault().requestStatus(id);
  }

  getPaginationState<T = any>(resource: string | Reference): PaginationState | null {
    return this.getVault().getPaginationState<T>(resource);
  }

  async loadNextPage(
    resource: string | Reference,
    json?: any
  ): Promise<[PaginationState | null, CollectionNormalized | null]> {
    return this.getVault().loadNextPage(resource, json);
  }

  getResourceMeta<T = any>(resource: string): Partial<T> | undefined;
  getResourceMeta<T = any, Key extends keyof T = keyof T>(resource: string, metaKey: Key): T[Key] | undefined;
  getResourceMeta<T = any, Key extends keyof T = keyof T>(
    resource: string,
    metaKey?: Key
  ): Partial<T> | T[Key] | undefined {
    return this.getVault().getResourceMeta(resource, metaKey as any);
  }

  getObject<R extends { type?: string }>(
    reference: string | Partial<R>,
    type?: string | GetObjectOptions,
    options?: GetObjectOptions
  ): RefToNormalized<R>;
  getObject<R extends { type?: string }>(
    reference: string | R | NormalizedEntity,
    type?: string | GetObjectOptions,
    options?: GetObjectOptions
  ): RefToNormalized<R> {
    return this.getVault().getObject(reference as any, type as any, options as any);
  }

  async loadObject<Type, NormalizedType = any>(
    id: string | Reference<any>,
    json?: any
  ): Promise<ReactiveWrapped<Type, NormalizedType>> {
    return this.getVault().loadObject(id, json);
  }

  async loadManifestObject(
    id: string | Reference<any>,
    json?: any
  ): Promise<ReactiveWrapped<Manifest, ManifestNormalized>> {
    return this.getVault().loadManifestObject(id, json);
  }

  async loadCollectionObject(
    id: string | Reference<any>,
    json?: any
  ): Promise<ReactiveWrapped<Collection, CollectionNormalized>> {
    return this.getVault().loadCollectionObject(id, json);
  }

  wrapObject<T extends string>(objectType: Reference<T>) {
    return this.getVault().wrapObject(objectType);
  }

  isWrapped(object: any) {
    return this.getVault().isWrapped(object);
  }

  setMetaValue<Value = any>(
    [id, meta, key]: [string, string, string],
    newValueOrUpdate: Value | ((oldValue: Value | undefined) => Value)
  ) {
    return this.getVault().setMetaValue([id, meta, key], newValueOrUpdate);
  }
}
