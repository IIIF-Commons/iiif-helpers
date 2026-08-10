/* eslint-disable @typescript-eslint/no-non-null-assertion */
import arcToCurve from "svg-arc-to-cubic-bezier";
import parseSvgPath from "parse-svg-path";
import absSvgPath, {
  AbsoluteCubicBezierCommand,
  AbsoluteLineCommand,
  AbsoluteMoveCommand,
  AbsoluteQuadraticBezierCommand,
} from "abs-svg-path";

export type NormalizedSvgPathCommand =
  | AbsoluteMoveCommand
  | AbsoluteLineCommand
  | AbsoluteCubicBezierCommand
  | AbsoluteQuadraticBezierCommand;

export type NormalizedSvgPathCommandType = "M" | "L" | "C" | "Q";

/** Parse an SVG path and normalize it so it only contains Moves, Lines and Cubic or Quadratic Bézier curves
 *  in their absolute form. */
export function parseAndNormalizeSvgPath(path: string): NormalizedSvgPathCommand[] {
  const parsed = parseSvgPath(path);
  const absolute = absSvgPath(parsed);

  let prevCmd: "M" | "L" | "H" | "V" | "C" | "S" | "Q" | "T" | "A" | "Z" | undefined;
  let startX = 0;
  let startY = 0;
  let bezierX = 0;
  let bezierY = 0;
  let quadX: number | undefined;
  let quadY: number | undefined;
  let x = 0;
  let y = 0;
  const out: NormalizedSvgPathCommand[] = [];
  for (let i = 0; i < absolute.length; i++) {
    let seg = absolute[i];
    const cmd = seg[0];
    switch (cmd) {
      case "M":
        startX = seg[1];
        startY = seg[2];
        break;
      case "H":
        seg = ["L", seg[1], startY];
        break;
      case "V":
        seg = ["L", startX, seg[1]];
        break;
      case "S":
        {
          let cx = x;
          let cy = y;
          if (prevCmd === "C" || prevCmd == "S") {
            cx += cx - bezierX;
            cy += cy - bezierY;
          }
          seg = ["C", cx, cy, seg[1], seg[2], seg[3], seg[4]];
        }
        break;
      case "T":
        if (prevCmd === "Q" || prevCmd == "T") {
          quadX = x * 2 - quadX!;
          quadY = y * 2 - quadY!;
        } else {
          quadX = x;
          quadY = y;
        }
        seg = ["Q", quadX, quadY, seg[1], seg[2]];
        break;
      case "Q":
        quadX = seg[1];
        quadY = seg[2];
        break;
      case "A":
        {
          const curves = arcToCurve({
            px: x,
            py: y,
            cx: seg[6],
            cy: seg[7],
            rx: seg[1],
            ry: seg[2],
            xAxisRotation: seg[3],
            largeArcFlag: seg[4],
            sweepFlag: seg[5],
          });
          if (!curves.length) {
            continue;
          }
          for (const [j, curve] of curves.entries()) {
            seg = ["C", curve.x1, curve.y1, curve.x2, curve.y2, curve.x, curve.y];
            if (j < curves.length - 1) {
              out.push(seg);
            }
          }
          // FIXME: Why do we need this cast?
          seg = seg as NormalizedSvgPathCommand;
        }
        break;
      case "Z":
        seg = ["L", startX, startY];
        break;
    }

    prevCmd = cmd;
    x = seg[seg.length - 2] as number;
    y = seg[seg.length - 1] as number;
    if (["C", "Q", "A"].indexOf(cmd) > -1) {
      bezierX = seg[seg.length - 4] as number;
      bezierY = seg[seg.length - 3] as number;
    } else {
      bezierX = x;
      bezierY = y;
    }
    out.push(seg);
  }

  return out;
}
