import { ChoiceBody, ImageService, InternationalString } from '@iiif/presentation-3';
import { ParsedSelector, SupportedTarget } from './annotation-targets';
import { ChoiceDescription, ComplexChoice, SingleChoice } from './painting-annotations';

// A wrapper for annotations that are "well-known"
interface ClassifiedAnnotation {
  id: string;
  type: 'Annotation';
  label?: InternationalString;
  summary?: InternationalString;
  motivation: string;
  target: SupportedTarget;
  body: SupportedBody;
}

interface AnnotationClassificationOptions {
  language?: string;
  choices?: string[];
  isTrusted?: boolean;
}

interface SimpleImage {
  id: string;
  format: string;
  label?: InternationalString;
  summary?: InternationalString;
  width?: number;
  height?: number;
  service?: ImageService;
}

type SupportedBody = {
  type: string;
  order: Array<'label' | 'summary' | 'image' | 'link' | 'internalLink' | 'content'>; // e.g. ['label', 'image', 'link', 'image']
  label?: InternationalString;
  summary?: InternationalString;
  content: InternationalString;
  image?: SimpleImage;
  images?: SimpleImage[];
  internalLink: {
    id: string;
    label?: InternationalString;
    type: 'Canvas';
    target: ParsedSelector;
  } | null;
  link: {
    id: string;
    label?: InternationalString;
    language?: string;
  } | null;
  contentList: InternationalString[];
  rawBody: any[];
  containsHtml: boolean;
  choice: ChoiceDescription | null;
};
