declare module "parse-svg-path" {
  export type MoveCommand = ["M" | "m", number, number];
  export type LineCommand = ["L" | "l", number, number];
  export type HorizontalLineCommand = ["H" | "h", number];
  export type VerticalLineCommand = ["V" | "v", number];
  export type CubicBezierCommand = ["C" | "c", number, number, number, number, number, number];
  export type SmoothCubicBezierCommand = ["S" | "s", number, number, number, number];
  export type QuadraticBezierCommand = ["Q" | "q", number, number, number, number];
  export type SmoothQuadraticBezierCommand = ["T" | "t", number, number];
  export type EllipticalArcCommand = ["A" | "a", number, number, number, 0 | 1, 0 | 1, number, number];
  export type ClosePathCommand = ["Z" | "z"];
  export type SvgPathCommand =
    | MoveCommand
    | LineCommand
    | HorizontalLineCommand
    | VerticalLineCommand
    | CubicBezierCommand
    | SmoothCubicBezierCommand
    | QuadraticBezierCommand
    | SmoothQuadraticBezierCommand
    | EllipticalArcCommand
    | ClosePathCommand;

  export default function parse(path: string): SvgPathCommand[];
}

declare module "abs-svg-path" {
  export type AbsoluteMoveCommand = ["M", number, number];
  export type AbsoluteLineCommand = ["L", number, number];
  export type AbsoluteHorizontalLineCommand = ["H", number];
  export type AbsoluteVerticalLineCommand = ["V", number];
  export type AbsoluteCubicBezierCommand = ["C", number, number, number, number, number, number];
  export type AbsoluteSmoothCubicBezierCommand = ["S", number, number, number, number];
  export type AbsoluteQuadraticBezierCommand = ["Q", number, number, number, number];
  export type AbsoluteSmoothQuadraticBezierCommand = ["T", number, number];
  export type AbsoluteEllipticalArcCommand = ["A", number, number, number, 0 | 1, 0 | 1, number, number];
  export type AbsoluteClosePathCommand = ["Z"];
  export type AbsoluteSvgPathCommand =
    | AbsoluteMoveCommand
    | AbsoluteLineCommand
    | AbsoluteHorizontalLineCommand
    | AbsoluteVerticalLineCommand
    | AbsoluteCubicBezierCommand
    | AbsoluteSmoothCubicBezierCommand
    | AbsoluteQuadraticBezierCommand
    | AbsoluteSmoothQuadraticBezierCommand
    | AbsoluteEllipticalArcCommand
    | AbsoluteClosePathCommand;

  export default function abs(path: SvgPathCommand[]): AbsoluteSvgPathCommand[];
}
