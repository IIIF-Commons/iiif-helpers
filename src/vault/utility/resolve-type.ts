import type { Entities } from '../types';

export function resolveType(type?: string): keyof Entities {
  switch (type) {
    case 'Image':
    case 'Video':
    case 'Sound':
    case 'Dataset':
    case 'Text':
    case 'Composite':
    case 'List':
    case 'Independents':
    case 'Audience':
    case 'SpecificResource':
    case 'CollectionPage':
    case 'Quantity':
    case 'RotateTransform':
    case 'ScaleTransform':
    case 'TranslateTransform':
    case 'PerspectiveCamera':
    case 'OrthographicCamera':
    case 'AmbientLight':
    case 'DirectionalLight':
    case 'PointLight':
    case 'SpotLight':
    case 'AmbientAudio':
    case 'PointAudio':
    case 'SpotAudio':
      return 'ContentResource';
    case 'ImageService1':
    case 'ImageService2':
    case 'ImageService3':
      return 'Service';
  }

  return type as any;
}
