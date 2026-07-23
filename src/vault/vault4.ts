/// <reference types="geojson" />

import { serializeConfigPresentation2 } from '@iiif/parser';
import {
  type SerializeConfig,
  serialize,
  serializeConfigPresentation3,
  serializeConfigPresentation4,
} from '@iiif/parser/presentation-4';
import type {
  Collection,
  CollectionPage,
  Manifest,
  Reference,
} from '@iiif/parser/presentation-4/types';
import type {
  CollectionNormalized,
  CollectionPageNormalized,
  ManifestNormalized,
} from '@iiif/parser/presentation-4-normalized/types';
import type { Entities } from './types';
import { actionListFromResourceV4, type ActionListFromResource } from './utility/action-list-from-resource';
import type { ReactiveWrapped } from './utility/objects';
import {
  type EntityRef,
  type GetObjectOptions,
  type GetOptions,
  Vault,
  type VaultOptions,
  type VaultTypeMap,
} from './vault';

type Vault4TypeMap = VaultTypeMap & {
  Manifest: Manifest;
  Collection: Collection;
  ManifestNormalized: ManifestNormalized;
  CollectionNormalized: CollectionNormalized;
};

export type Vault4Options = VaultOptions;
export type Vault4GetOptions = GetOptions;
export type Vault4GetObjectOptions = GetObjectOptions;
export type Vault4EntityRef<Ref extends keyof Entities> = EntityRef<Ref>;

/**
 * A fixed Presentation 4 view over the shared Vault runtime.
 *
 * Only normalization and serialization differ from {@link Vault}; state,
 * loading, subscriptions, pagination and wrapping are inherited unchanged.
 */
export class Vault4 extends Vault<Vault4TypeMap> {
  protected override getActionListFromResource(): ActionListFromResource {
    return actionListFromResourceV4;
  }

  override serialize<Return>(entity: Reference<keyof Entities>, config: SerializeConfig): Return {
    return serialize<Return>(this.getState().iiif as any, entity as any, config as any);
  }

  override toPresentation2<Return>(entity: Reference<keyof Entities>): Return {
    return this.serialize<Return>(entity, serializeConfigPresentation2 as any);
  }

  override toPresentation3<Return>(entity: Reference<keyof Entities>): Return {
    return this.serialize<Return>(entity, serializeConfigPresentation3);
  }

  toPresentation4<Return>(entity: Reference<keyof Entities>): Return {
    return this.serialize<Return>(entity, serializeConfigPresentation4);
  }

  loadCollectionPage(
    id: string | Reference<any>,
    json?: unknown,
    mapper?: (resource: any) => any
  ): Promise<CollectionPageNormalized | undefined> {
    return this.load<CollectionPageNormalized>(id, json, mapper);
  }

  loadCollectionPageSync(
    id: string | Reference<any>,
    json: unknown,
    mapper?: (resource: any) => any
  ): CollectionPageNormalized | undefined {
    return this.loadSync<CollectionPageNormalized>(id, json, mapper);
  }

  async loadCollectionPageObject(
    id: string | Reference<any>,
    json?: any
  ): Promise<ReactiveWrapped<CollectionPage, CollectionPageNormalized>> {
    return super.loadObject<CollectionPage, CollectionPageNormalized>(id as any, json);
  }
}
