import { ImageServiceLoader } from './image-service-loader';
import { createStore } from 'zustand/vanilla';
import mitt, { Emitter, Handler } from 'mitt';
import { ImageService } from '@iiif/presentation-3';
import { getId } from '@iiif/parser/image-3';

export type LoadImageServiceDetail = {
  width: number;
  height: number;
  force?: boolean;
};

export interface ImageServiceStore {
  loaded: Record<
    string,
    {
      status: 'loading' | 'done' | 'error';
      service: ImageService | null;
      error?: boolean;
      errorMesage?: string;
      real?: boolean;
    }
  >;

  loadServiceSync: (
    service: ImageService,
    detail?: LoadImageServiceDetail,
    backgroundRequest?: boolean
  ) => ImageService | null;
  loadService: (service: ImageService, detail?: LoadImageServiceDetail) => Promise<ImageService | null>;
}

export interface ImageServiceStoreOptions {
  loader?: ImageServiceLoader;
  events?: Emitter<ImageServiceStoreEvents>;
}

export type ImageServiceStoreEvents = {
  'image-service.loaded': {
    id: string;
    service: ImageService | null;
  };
  'image-service.loading': {
    id: string;
  };
  'image-service.error': {
    id: string;
    error: Error;
  };
};

export function createImageServiceStore(options: ImageServiceStoreOptions = {}) {
  const events = options.events || mitt<ImageServiceStoreEvents>();
  const loader = options.loader || new ImageServiceLoader();

  const store = createStore<ImageServiceStore>((set, get) => ({
    loaded: {},

    loadServiceSync: (service, detail, backgroundRequest) => {
      const id = service.id || (service['@id'] as string);
      const existing = get().loaded[id];

      if (existing && existing.status === 'done') {
        return existing.service;
      }

      if (existing && existing.status === 'loading') {
        return null;
      }

      if (existing && existing.status === 'error') {
        throw new Error('Failed to load image service');
      }

      const request = {
        id: getId(service),
        width: service.width || detail?.width || 0,
        height: service.height || detail?.height || 0,
        source: service,
      };

      const loaded = loader.loadServiceSync(request);
      if (loaded) {
        set((state) => ({
          loaded: {
            ...state.loaded,
            [id]: {
              status: 'done',
              service: loaded,
              real: true,
            },
          },
        }));

        events.emit('image-service.loaded', { id, service: loaded });
      } else {
        if (backgroundRequest) {
          get()
            .loadService(service, detail)
            .then(() => {
              // ?
            });
        }
      }

      return loaded;
    },

    loadService: async (service: ImageService, detail) => {
      const id = service.id || (service['@id'] as string);
      const existing = get().loaded[id];

      if (existing && existing.status === 'done') {
        return existing.service;
      }

      if (existing && existing.status === 'loading') {
        return new Promise<ImageService>((resolve, reject) => {
          const handler: Handler<ImageServiceStoreEvents['image-service.loaded']> = (e) => {
            if (e.id === id) {
              events.off('image-service.loaded', handler);
              resolve(e.service || service);
            }
          };
          events.on('image-service.loaded', handler);
        });
      }

      if (existing && existing.status === 'error' && !detail?.force) {
        throw new Error('Failed to load image service');
      }

      events.emit('image-service.loading', { id });
      try {
        const request = {
          id: getId(service),
          width: service.width || 0,
          height: service.height || 0,
          source: service,
        };

        const loaded = await loader.loadService(request, detail?.force);

        set((state) => ({
          loaded: {
            ...state.loaded,
            [id]: {
              status: 'done',
              service: loaded,
              real: (loaded as any).real,
            },
          },
        }));

        events.emit('image-service.loaded', { id, service: loaded });

        return loaded;
      } catch (error: any) {
        events.emit('image-service.error', { id, error });
        throw error;
      }
    },
  }));

  return {
    store,
    events,
  };
}

export const imageServices = createImageServiceStore();
