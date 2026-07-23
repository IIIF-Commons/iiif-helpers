import type { Entities } from '../types';

export function resolveType(type?: string): keyof Entities {
  switch (type) {
    case 'Image':
    case 'Video':
    case 'Audio':
    case 'Sound':
    case 'Model':
    case 'Dataset':
    case 'Text':
    case 'TextualBody':
    case 'Choice':
    case 'Composite':
    case 'List':
    case 'Independents':
    case 'Audience':
    case 'SpecificResource':
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
    case 'AudioEmitters':
    case 'Camera':
    case 'Light':
    case 'PointAudio':
    case 'SpotAudio':
      return 'ContentResource';
    case 'AnimationSelector':
    case 'AudioContentSelector':
    case 'FragmentSelector':
    case 'ImageApiSelector':
    case 'PointSelector':
    case 'SvgSelector':
    case 'VisualContentSelector':
    case 'WktSelector':
      return 'Selector';
    case 'CollectionPage':
      return 'CollectionPage';
    case 'ImageService1':
    case 'ImageService2':
    case 'ImageService3':
      return 'Service';
  }

  return type as any;
}
