import type { Entities } from '../types';

export function getDefaultEntities(): Entities {
  return {
    Collection: {},
    CollectionPage: {},
    Manifest: {},
    Canvas: {},
    AnnotationPage: {},
    AnnotationCollection: {},
    Annotation: {},
    ContentResource: {},
    Range: {},
    Service: {},
    Selector: {},
    Agent: {},
    Timeline: {},
    Scene: {},
  };
}
