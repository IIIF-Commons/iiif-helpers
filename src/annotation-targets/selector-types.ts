import type { ImageApiSelector } from '@iiif/presentation-3';

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
    width?: number;
    height?: number;
  };
  rotation?: number;
  points?: [number, number][];
  svg?: string;
  svgShape?: SvgShapeType;
  style?: SelectorStyle;
  boxStyle?: BoxStyle;
}

export type BoxStyle = _BoxStyle & {
  ':hover'?: _BoxStyle;
  ':active'?: _BoxStyle;
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
}

export interface PointSelector extends SupportedSelector {
  type: 'PointSelector';
  spatial: {
    x: number;
    y: number;
  };
  rotation?: number;
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
  | SvgSelector
  | RotationSelector;

export type ParsedSelector = {
  selector: SupportedSelectors | null;
  selectors: SupportedSelectors[];
  iiifRenderingHints?: ImageApiSelector;
};
