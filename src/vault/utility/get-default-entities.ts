import type { Entities } from '../types';

export function getDefaultEntities(): Entities {
  return {
    Collection: {},
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
