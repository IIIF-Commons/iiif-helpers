import type { ImageApiSelector as ImageApiSelectorV3 } from '@iiif/parser/presentation-3/types';
import type { ImageApiSelector as ImageApiSelectorV4 } from '@iiif/parser/presentation-4/types';

type ImageApiSelector = ImageApiSelectorV3 | ImageApiSelectorV4;

export type SvgShapeType = 'rect' | 'circle' | 'ellipse' | 'line' | 'polyline' | 'polygon' | 'path';
export interface SupportedSelector {
  type: string;
  temporal?: {
    startTime: number;
    endTime?: number;
  };
  spatial?: {
    unit?: 'percent' | 'pixel';
    x: number;
    y: number;
    z?: number;
    width?: number;
    height?: number;
  };
  rotation?: number;
  rotationOrigin?: TransformPoint;
  translate?: TransformPoint;
  transform?: SelectorTransform;
  points?: [number, number][];
  points3d?: [number, number, number][];
  svg?: string;
  svgShape?: SvgShapeType;
  style?: SelectorStyle;
  boxStyle?: BoxStyle;
}

export type BoxStyle = _BoxStyle & {
  ':hover'?: _BoxStyle;
  ':active'?: _BoxStyle;
};

export type TransformUnit = 'pixel' | 'percent';

export type TransformPoint = {
  x: number;
  y: number;
  unit?: TransformUnit;
  xUnit?: TransformUnit;
  yUnit?: TransformUnit;
};

export type SelectorTransform = {
  rotation?: number;
  rotationOrigin?: TransformPoint;
  translate?: TransformPoint;
  transform?: string;
  transformOrigin?: string;
};

type _BoxStyle = Partial<{
  backgroundColor: string;
  opacity: number;
  boxShadow: string;
  borderColor: string;
  borderWidth: string;
  borderStyle: string;
  outlineColor: string;
  outlineWidth: string;
  outlineOffset: string;
  outlineStyle: string;
  border: string;
  outline: string;
  background: string;
  transform: string;
  transformOrigin: string;
}>;

export interface SelectorStyle {
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeOpacity?: number;
  strokeWidth?: string;
  strokeDasharray?: string;
}

export interface BoxSelector extends SupportedSelector {
  type: 'BoxSelector';
  spatial: {
    unit?: 'percent' | 'pixel';
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotation?: number;
  rotationOrigin?: TransformPoint;
  translate?: TransformPoint;
  transform?: SelectorTransform;
}

export interface PointSelector extends SupportedSelector {
  type: 'PointSelector';
  spatial: {
    x: number;
    y: number;
    z?: number;
  };
  rotation?: number;
  rotationOrigin?: TransformPoint;
  translate?: TransformPoint;
  transform?: SelectorTransform;
}

export interface WktSelector extends SupportedSelector {
  type: 'WktSelector' | 'WKTSelector';
  value: string;
}

export interface PolygonZSelector extends SupportedSelector {
  type: 'PolygonZSelector';
  value: string;
}

export interface AnimationSelector extends SupportedSelector {
  type: 'AnimationSelector';
  value: string;
}

export interface SvgSelector extends SupportedSelector {
  type: 'SvgSelector';
  svg: string;
  svgShape?: SvgShapeType;
  points?: [number, number][];
  spatial?: {
    unit: 'pixel';
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotation?: number;
  rotationOrigin?: TransformPoint;
  translate?: TransformPoint;
  transform?: SelectorTransform;
}

export interface TemporalSelector extends SupportedSelector {
  type: 'TemporalSelector';
  temporal: {
    startTime: number;
    endTime?: number;
  };
}

export interface RotationSelector extends SupportedSelector {
  type: 'RotationSelector';
  rotation: number;
}

export interface TemporalBoxSelector extends SupportedSelector {
  type: 'TemporalBoxSelector';
  spatial: {
    unit?: 'percent' | 'pixel';
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotation?: number;
  rotationOrigin?: TransformPoint;
  translate?: TransformPoint;
  transform?: SelectorTransform;
  temporal: {
    startTime: number;
    endTime?: number;
  };
}

export type SupportedSelectors =
  | TemporalSelector
  | BoxSelector
  | TemporalBoxSelector
  | PointSelector
  | WktSelector
  | PolygonZSelector
  | AnimationSelector
  | SvgSelector
  | RotationSelector;

export type ParsedSelector = {
  selector: SupportedSelectors | null;
  selectors: SupportedSelectors[];
  iiifRenderingHints?: ImageApiSelector;
};
