import type { Entities } from '../types';

export function resolveType(type: string): keyof Entities {
  switch (type) {
    // Content resource types (P3 + P4)
    case 'Image':
    case 'Video':
    case 'Sound':
    case 'Dataset':
    case 'Text':
    case 'Composite':
    case 'List':
    case 'Independents':
    case 'Audience':
    // P4 content resource types
    case 'Model':
    case 'TextualBody':
    case 'Choice':
    case 'Audio':
    // P4 scene component types (stored as ContentResource)
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

    // Service types
    case 'ImageService1':
    case 'ImageService2':
    case 'ImageService3':
      return 'Service';

    // P4 container types
    case 'Timeline':
      return 'Timeline';
    case 'Scene':
      return 'Scene';

    // P4 structural types
    case 'Quantity':
      return 'Quantity';

    // P4 transform types
    case 'Transform':
    case 'RotateTransform':
    case 'ScaleTransform':
    case 'TranslateTransform':
      return 'Transform';
  }

  return type as any;
}
