# Content State

:::info
This helper does not require `@iiif/vault` to work and the helpers can be used on any loaded Presentation 3 resource.
:::

Collection of helpers that can encode, decode and normalize IIIF Content State to be read by viewers.

Available helpers:

- `parseContentState(stateString, isAsync)`
- `normaliseContentState(annotation)`
- `serialiseContentState(annotation)`
- `encodeContentState(stateString)`
- `decodeContentState(encodedContentState)`
- `validateContentState(annotation)`

### parseContentState(state)

This is the primary helper that can be used to parse content state. The input can either be an encoded
string or a decoded JSON string.

```ts
import { parseContentState } from "@iiif/vault-helpers/content-state";

const state = parseContentState("JTdCJTIyaWQlMjIlM0ElM ...");
/* => 
{
  id: 'https://example.org/object1/canvas7#xywh=1000,2000,1000,2000',
  type: 'Canvas',
  partOf: [{ id: 'https://example.org/object1/manifest', type: 'Manifest' }],
} 
*/
```

Once parsed, the content state can be normalized - or used like this. If the content state is a remote
resource, you can pass the `isAsync` and await the result. This will fetch the remote annotation:

```js
import { parseContentState } from "@iiif/vault-helpers/content-state";

const state = await parseContentState("https://example.org/content-state/123.json", true);
```

### normaliseContentState(stateString, isAsync)

Given the following decoded content state:

```json
{
  "@context": "http://iiif.io/api/presentation/3/context.json",
  "id": "https://example.org/import/1",
  "type": "Annotation",
  "motivation": ["contentState"],
  "target": {
    "id": "https://example.org/object1/canvas7#xywh=1000,2000,1000,2000",
    "type": "Canvas",
    "partOf": [
      {
        "id": "https://example.org/object1/manifest",
        "type": "Manifest"
      }
    ]
  }
}
```

The normalisation step will produce:

```js
{
  "id": "https://example.org/import/1",
  "type": "Annotation",
  "motivation": ["contentState"],
  "target": [{
    "selector": {
      "spatial": {
        "height": 2000,
        "unit": "pixel",
        "width": 1000,
        "x": 1000,
        "y": 2000,
      },
      "type": "BoxSelector",
    },
    "selectors": [
      {
        "spatial": {
          "height": 2000,
          "unit": "pixel",
          "width": 1000,
          "x": 1000,
          "y": 2000,
        },
        "type": "BoxSelector",
      },
    ],
    "source": {
      "id": "https://example.org/object1/canvas7",
      "partOf": [{
         "id": "https://example.org/object1/manifest",
         "type": "Manifest",
      }],
      "type": "Canvas",
    },
    "type": "SpecificResource",
  }],
}
```

### serialiseContentState(state)

This will produce a base64 encoded content state that can be used and decoded by another viewer.

```ts
import { serialiseContentState } from "@iiif/vault-helpers/content-state";

const encoded = serialiseContentState({
  id: "https://example.org/object1/canvas7#xywh=1000,2000,1000,2000",
  type: "Canvas",
  partOf: [{ id: "https://example.org/object1/manifest", type: "Manifest" }],
}); // => JTdCJTIyaWQlMjI...
```

### encodeContentState(stateString)

Similar to `serialiseContentState` but it _must_ already be a JSON string.

```ts
import { serialiseContentState } from "@iiif/vault-helpers/content-state";

const encoded = serialiseContentState(`{
  "id": "https://example.org/object1/canvas7#xywh=1000,2000,1000,2000",
  "type": "Canvas",
  "partOf": [{ "id": "https://example.org/object1/manifest", "type": "Manifest" }],
}`); // => JTdCJTIyaWQlMjI...
```

### decodeContentState(encodedContentState)

This is the counter-part to `encodeContentState()`, returning a JSON string that can be passed to `JSON.parse()`.

```ts
const state = parseContentState("JTdCJTIyaWQlMjIlM0ElM ...");

// -> '{"id": "https://example.org/object1/canvas7#xywh=1000,2000,1000,2000", ...
```

This uses the [Annotation targets](./annotation-targets.md) helper internally to parse the selector within
the content state.

### validateContentState(state)

:::danger
Validation is still a work in progress.
:::

Takes in a decoded content state, either as an Object or a JSON string.

```ts
validateContentState(`
{ 
  "type": "Annotation", 
  "target": "https://example.org/canvas-1",
  "partOf": "https://example.org/manifest", 
}
`); // -> true
```

The second argument `strict` will ensure that the content state has a `partOf` if the "type" is a canvas.
