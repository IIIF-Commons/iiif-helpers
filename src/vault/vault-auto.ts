import type { SerializeConfig } from '@iiif/parser';
import type { Collection, Manifest, Reference, SpecificResource } from '@iiif/parser/presentation-3/types';
import type {
  CollectionNormalized as CollectionNormalizedV3,
  ManifestNormalized as ManifestNormalizedV3,
} from '@iiif/parser/presentation-3-normalized/types';
import { normalize as normalizePresentation4 } from '@iiif/parser/presentation-4';
import type {
  CollectionNormalized as CollectionNormalizedV4,
  ManifestNormalized as ManifestNormalizedV4,
  Presentation4NormalizeResult,
} from '@iiif/parser/presentation-4-normalized/types';
import type { BatchAction } from './actions';
import type { VaultZustandStore } from './store';
import type {
  ActionFromType,
  AllActions,
  Entities,
  IIIFStore,
  NormalizedEntity,
  PaginationState,
  RefToNormalized,
  RequestState,
} from './types';
import { defaultFetcher } from './utility/default-fetcher';
import type { ReactiveWrapped } from './utility/objects';
import { type GetObjectOptions, type GetOptions, Vault, type VaultOptions } from './vault';
import { Vault4 } from './vault4';

type VaultAutoLoadJournalEntry = {
  id: string;
  resource: unknown;
};

export type CanonicalSpecificResource = {
  source: { id: string; type: string };
  selector: Array<{ type: string; [key: string]: unknown }>;
  styleClass?: string;
  language?: string[];
  raw: unknown;
};

export type VaultAutoOptions = Partial<VaultOptions> & {
  enablePresentation4?: boolean;
  onVersionSwitch?: (from: 3, to: 4, context: { triggerId: string }) => void;
  onVersionProbe?: (probe: {
    id: string;
    sourceVersion: Presentation4NormalizeResult['sourceVersion'];
    diagnosticsCount: number;
    rootType: string;
    shouldSwitch: boolean;
  }) => void;
};

function cloneForReplay<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function splitIdFragment(id: string): {
  idWithoutFragment: string;
  fragment?: string;
} {
  const hashIndex = id.indexOf('#');
  if (hashIndex === -1) {
    return { idWithoutFragment: id };
  }
  return {
    idWithoutFragment: id.slice(0, hashIndex),
    fragment: id.slice(hashIndex + 1),
  };
}

/**
 * @deprecated Choose {@link Vault} for the Presentation 3 compatibility view or
 * {@link Vault4} for Presentation 4. Automatic switching replaces the backing
 * store and cannot preserve live subscriptions or in-memory edits reliably.
 */
export class VaultAuto {
  private readonly options: Required<Pick<VaultAutoOptions, 'enablePresentation4'>> &
    Omit<VaultAutoOptions, 'enablePresentation4'>;
  private readonly vaultOptions: Partial<VaultOptions>;
  private readonly fetcher: <T>(url: string, options: T) => unknown | Promise<unknown>;
  private readonly baseVault: Vault;
  private vault4Internal?: Vault4;
  private activeVault: Vault | Vault4;
  private loadJournal: VaultAutoLoadJournalEntry[] = [];

  constructor(options?: VaultAutoOptions) {
    const {
      enablePresentation4 = false,
      onVersionSwitch,
      onVersionProbe,
      reducers,
      defaultState,
      customFetcher,
      enableDevtools,
    } = options || {};

    this.options = {
      enablePresentation4,
      onVersionSwitch,
      onVersionProbe,
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

    this.fetcher = customFetcher || defaultFetcher;
    this.baseVault = new Vault(this.vaultOptions);
    this.activeVault = this.baseVault;
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

  private getVault(): Vault | Vault4 {
    return this.activeVault;
  }

  private shouldUseAutoLoadPath(): boolean {
    return this.options.enablePresentation4 && !this.vault4Internal;
  }

  private pushToJournal(id: string, resource: unknown) {
    this.loadJournal.push({
      id,
      resource: cloneForReplay(resource),
    });
  }

  private probeV4Switch(id: string, resource: unknown) {
    let probeResult: {
      id: string;
      sourceVersion: Presentation4NormalizeResult['sourceVersion'];
      diagnosticsCount: number;
      rootType: string;
      shouldSwitch: boolean;
    };

    try {
      const probed = normalizePresentation4(resource) as Presentation4NormalizeResult;
      const hasScene = probed.resource.type === 'Scene' || Object.values(probed.mapping).includes('Scene');
      const hasTimeline = probed.resource.type === 'Timeline' || Object.values(probed.mapping).includes('Timeline');
      const shouldSwitch = probed.sourceVersion === 4 || hasScene || hasTimeline;

      probeResult = {
        id,
        sourceVersion: probed.sourceVersion,
        diagnosticsCount: probed.diagnostics.length,
        rootType: probed.resource.type,
        shouldSwitch,
      };
    } catch {
      probeResult = {
        id,
        sourceVersion: 'unknown',
        diagnosticsCount: 0,
        rootType: 'unknown',
        shouldSwitch: false,
      };
    }

    if (this.options.onVersionProbe) {
      this.options.onVersionProbe(probeResult);
    }

    return probeResult.shouldSwitch;
  }

  private maybeSwitchToV4(id: string, resource: unknown) {
    if (!this.options.enablePresentation4 || this.vault4Internal) {
      return;
    }
    if (!this.probeV4Switch(id, resource)) {
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
    return (this.getVault() as any).serialize(entity, config as any) as Return;
  }

  toPresentation2<Return>(entity: Reference<keyof Entities>) {
    return this.getVault().toPresentation2<Return>(entity);
  }

  toPresentation3<Return>(entity: Reference<keyof Entities>) {
    return this.getVault().toPresentation3<Return>(entity);
  }

  hydrate<R extends { type?: string }>(
    reference: string | Partial<R>,
    type?: string | GetOptions,
    options?: GetOptions
  ): RefToNormalized<R>;
  hydrate<R extends { type?: string }>(
    reference: string[] | Partial<R>[],
    type?: string | GetOptions,
    options?: GetOptions
  ): RefToNormalized<R>[];
  hydrate<R extends { type?: string }>(
    reference: string | R | NormalizedEntity | string[] | R[] | NormalizedEntity[],
    type?: string | GetOptions,
    options: GetOptions = {}
  ): RefToNormalized<R> | RefToNormalized<R>[] {
    return (this.getVault() as any).hydrate(reference as any, type as any, options as any);
  }

  get<R extends { type?: string }>(
    reference: string | Partial<R> | Reference<R['type']> | SpecificResource<R>,
    type?: string | GetOptions,
    options?: GetOptions
  ): RefToNormalized<R>;
  get<R extends { type?: string }>(
    reference: string[] | Partial<R>[] | Reference<R['type']>[] | SpecificResource<R>[],
    type?: string | GetOptions,
    options?: GetOptions
  ): RefToNormalized<R>[];
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
  ): RefToNormalized<R> | RefToNormalized<R>[] {
    return (this.getVault() as any).get(reference as any, type as any, options as any);
  }

  asArray<T>(value: T | T[] | null | undefined): T[] {
    if (typeof value === 'undefined' || value === null) {
      return [];
    }
    return Array.isArray(value) ? value : [value];
  }

  getCanonicalSpecificResource(input: unknown): CanonicalSpecificResource | null {
    const resolved = this.get(input as any, {
      skipSelfReturn: false,
      preserveSpecificResources: true,
    }) as any;
    const candidate = resolved ?? input;
    if (!candidate || typeof candidate !== 'object') {
      return null;
    }

    let source: any = null;
    let selector: Array<{ type: string; [key: string]: unknown }> = [];
    let styleClass: string | undefined;
    let language: string[] | undefined;

    if (candidate.type === 'SpecificResource') {
      source = candidate.source ?? null;
      selector = this.asArray(candidate.selector as any);
      styleClass = candidate.styleClass;
      language = Array.isArray(candidate.language) ? candidate.language : undefined;
    } else if (typeof candidate.id === 'string') {
      source = candidate;
    } else if (typeof candidate === 'string') {
      source = { id: candidate, type: 'unknown' };
    } else {
      return null;
    }

    if (typeof source === 'string') {
      source = { id: source, type: 'unknown' };
    }
    if (!source || typeof source.id !== 'string') {
      return null;
    }

    const { idWithoutFragment, fragment } = splitIdFragment(source.id);
    if (fragment) {
      source = {
        ...source,
        id: idWithoutFragment,
      };
      if (!selector.length) {
        selector = [{ type: 'FragmentSelector', value: fragment }];
      }
    }

    return {
      source: {
        id: source.id,
        type: source.type || 'unknown',
      },
      selector,
      styleClass,
      language,
      raw: candidate,
    };
  }

  resolveAnnotationTargets(annotation: unknown): CanonicalSpecificResource[] {
    const fullAnnotation = this.get(annotation as any, {
      skipSelfReturn: false,
    }) as any;
    if (!fullAnnotation || typeof fullAnnotation !== 'object') {
      return [];
    }

    return this.asArray(fullAnnotation.target)
      .map((target) => this.getCanonicalSpecificResource(target))
      .filter((target): target is CanonicalSpecificResource => target !== null);
  }

  resolveAnnotationBodies(annotation: unknown): any[] {
    const fullAnnotation = this.get(annotation as any, {
      skipSelfReturn: false,
    }) as any;
    if (!fullAnnotation || typeof fullAnnotation !== 'object') {
      return [];
    }

    return this.asArray(fullAnnotation.body)
      .map((body) => this.get(body as any, { skipSelfReturn: false }) as any)
      .filter((body) => body !== null && typeof body !== 'undefined')
      .map((body) => {
        if (body?.type === 'SpecificResource' && body?.source) {
          const unwrapped = this.get(body.source, {
            skipSelfReturn: false,
          }) as any;
          return unwrapped ?? body.source;
        }
        return body;
      });
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
  ): Promise<ManifestNormalizedV3 | ManifestNormalizedV4 | undefined> {
    const _id = typeof id === 'string' ? id : id.id;
    return this.load<ManifestNormalizedV3 | ManifestNormalizedV4>(_id, json, mapper);
  }

  loadCollection(
    id: string | Reference<any>,
    json?: unknown,
    mapper?: (resource: any) => any
  ): Promise<CollectionNormalizedV3 | CollectionNormalizedV4 | undefined> {
    const _id = typeof id === 'string' ? id : id.id;
    return this.load<CollectionNormalizedV3 | CollectionNormalizedV4>(_id, json, mapper);
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
  ): ManifestNormalizedV3 | ManifestNormalizedV4 | undefined {
    const _id = typeof id === 'string' ? id : id.id;
    return this.loadSync<ManifestNormalizedV3 | ManifestNormalizedV4>(_id, json, mapper);
  }

  loadCollectionSync(
    id: string | Reference<any>,
    json: unknown,
    mapper?: (resource: any) => any
  ): CollectionNormalizedV3 | CollectionNormalizedV4 | undefined {
    const _id = typeof id === 'string' ? id : id.id;
    return this.loadSync<CollectionNormalizedV3 | CollectionNormalizedV4>(_id, json, mapper);
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
  ): Promise<[PaginationState | null, CollectionNormalizedV3 | CollectionNormalizedV4 | null]> {
    return (this.getVault() as any).loadNextPage(resource, json);
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
    return (this.getVault() as any).getObject(reference as any, type as any, options as any);
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
  ): Promise<ReactiveWrapped<Manifest, ManifestNormalizedV3 | ManifestNormalizedV4>> {
    return (this.getVault() as any).loadManifestObject(id, json);
  }

  async loadCollectionObject(
    id: string | Reference<any>,
    json?: any
  ): Promise<ReactiveWrapped<Collection, CollectionNormalizedV3 | CollectionNormalizedV4>> {
    return (this.getVault() as any).loadCollectionObject(id, json);
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
