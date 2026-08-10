# Annotation targets

:::info
This helper does not require `@iiif/vault` to work and the helpers can be used on any loaded Presentation 3 resource.
:::

When working with IIIF Annotations you will come across various types of Annotation targets supported by the
[W3C Annotation Model](https://www.w3.org/TR/annotation-model/#bodies-and-targets). In IIIF most Annotations will
target a IIIF Canvas, either the whole Canvas or a region of it. This helper aims to make parsing selectors easier.

It offers the following helpers:

- `expandTarget`
- `parseSelector`

### expandTarget()

This helper has the following signature:

```typescript
function expandTarget(
  target: W3CAnnotationTarget | W3CAnnotationTarget[],
  options: {
    typeMap?: Record<string, string>;
    domParser?: DOMParser;
    svgPreprocessor?: (svg: string) => string;
  } = {}
): SupportedTarget;
```

You can use this on any `annotation.target` property defined in a IIIF Canvas or external Annotation Page.

```ts
import { expandTarget } from "@iiif/vault-helpers/annotation-targets";

const expanded = expandTarget("https://example.org/canvas#xywh=1,2,3,4");
/*
{
  type: 'BoxSelector',
  spatial: {
    x: 1,
    y: 2,
    width: 3,
    height: 4,
  }
}
*/
```

In addition to strings, it will also support expanded variations:

```json
{
  "type": "SpecificResource",
  "source": "https://example.org/canvas",
  "selector": {
    "type": "FragmentSelector",
    "value": "xywh=1,2,3,4"
  }
}
```

### parseSelector()

This helper is used by `expandTarget()` and is simply a way to parse only the selector and not the full target. For
example:

```ts
import { parseSelector } from "@iiif/vault-helpers/annotation-targets";

const expanded = parseSelector({
  type: "FragmentSelector",
  value: "xywh=1,2,3,4",
});

/*
{
  type: 'BoxSelector',
  spatial: {
    x: 1,
    y: 2,
    width: 3,
    height: 4,
  }
}
*/
```

## Supported targets

With both helpers, the returned objects will have a custom shape to make it the selectors predictable. This is
defined in the Typescript types and should offer completion when using the library in supported editors. Every selector
will have the following shape:

```ts
interface SupportedSelector {
  type: string;
  temporal?: {
    startTime: number;
    endTime?: number;
  };
  spatial?: {
    unit?: "percent" | "pixel";
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  points?: [number, number][];
  svg?: string;
  svgShape?: SvgShapeType; // 'rect' | 'circle' | 'ellipse' | 'line' | 'polyline' | 'polygon' | 'path'
  style?: SelectorStyle; // { fill?: string, strokeWidth: ... }
}
```

Using this you can progressively support more complex selectors for your viewer. For example, if you support the
`.spatial` property to render boxes, you will still see more complex SVG selectors highlighted by a bounding box.
Although this is not fully representative of the selector, it is better than not showing the selector!

All selectors can optionally have a temporal element, indicating that they should only be displayed between the
`startTime` and `endTime` for Canvases with a duration.

Currently, the following selectors are created by the helper:

- `BoxSelector` - a non-rotated box, with a non-zero `spatial.height` and `spatial.width`
- `PointSelector` - a single point without a `spatial.height` or `spatial.width`
- `SvgSelector` - an SVG shape, with style extracted and a bounding box in `spatial`
- `TemporalSelector` - only time selector
- `TemporalBoxSelector` - BoxSelector with additional temporal property

:::tip

If you find an unsupported selector, please [Raise an issue on GitHub](https://github.com/IIIF-Commons/vault-helpers/issues/new).

:::

If you are using Typescript or an editor that supports types you can narrow the types and get accurate completions:

```typescript
switch (selector.type) {
  case "BoxSelector":
  // selector.spatial.width; // number
  case "PointSelector":
  // selector.spatial.width; // undefined
}
```

### BoxSelector

The box selector will be returned when there is a compatible [media fragment](https://www.w3.org/TR/media-frags/)
selector, the fragment will be parsed - along with the unit (`pixel` / `percent`).

Example output:

```js
{
  type: 'BoxSelector',
  spatial: {
    unit: 'pixel',
    x: 1,
    y: 2,
    width: 3,
    height: 4,
  }
}
```

### PointSelector

The box selector will be returned when there is a compatible [media fragment](https://www.w3.org/TR/media-frags/)
selector without a height or width, the fragment will be parsed - along with the unit (`pixel` / `percent`).

Example output:

```js
{
  type: 'PointSelector',
  spatial: {
    unit: 'pixel',
    x: 1,
    y: 2,
  }
}
```

### SVG Selector

The SVG selector is more complicated than the others. It requires `DOMParser` which is available in the browser or can
be installed using `happy-dom` or `jsdom` for usage in NodeJS.

Given the following SVG:

```svg
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <g>
    <rect x="100" y="100" width="300" height="300" stroke="#000" fill="#fff"/>
  </g>
</svg>
```

The following will be returned:

```js
{
  points: [
    [ 100, 100 ],
    [ 400, 100 ],
    [ 400, 400 ],
    [ 100, 400 ],
    [ 100, 100 ]
  ],
  spatial: {
    height: 300,
    unit: "pixel",
    width: 300,
    x: 100,
    y: 100
  },
  style: {
    fill: "#fff",
    stroke: "#000"
  },
  svg: "<svg width=\"800\" height=\"600\" xmlns=\"http://www.w3.org/2000/svg\"><g><rect x=\"100\" y=\"100\" width=\"300\" height=\"300\"></rect></g></svg>",
  svgShape: "rect",
  type: "SvgSelector"
}
```

A lot happened during the parsing of this selector:

- **The style was extracted from the SVG** - this makes rendering the SVGs directly more predictable.
- **A bounding box was detected around the SVG** - a fallback, if it is impractical to support full SVGs
- **A list of points were extracted** - if you are rendering using an HTML Canvas, these can easily be used in draw calls.
- **The SVG shape was detected** - This may be useful if you want to support a subset of SVG selectors.

This helper has been tested with commonly used Annotation tools that output SVGs.

### TemporalSelector

Temporal selectors are common for Audio and Video content in IIIF. They usually use media frags `#t=10,20`

:::caution
Temporal selectors **do not support** time formatted in HH:mm:ss like `t=00:00,02:34`. All time fragments are expected
to be in seconds.
:::

```js
{
  type: 'TemporalSelector',
  temporal: {
    startTime: 10,
    endTime: 20
  }
}
```

### TemporalBoxSelector

This is a combination of the BoxSelector and TemporalSelector, where media frags contain both a spatial and temporal
element. e.g. `#t=10,20&xwyh=100,200,300,400`

```js
{
  type: 'TemporalSelector',
  spatial: {
    unit: 'pixel',
    x: 100,
    y: 200,
    width: 300,
    height: 400,
  },
  temporal: {
    startTime: 10,
    endTime: 20
  }
}
```
