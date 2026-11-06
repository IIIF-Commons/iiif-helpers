# Thumbnails

:::danger
This helper is still a work in progress. It may return thumbnails that are not optimized for delivery by image services
and be slower to load.
:::

Work-in-progress vault-driven thumbnails.

Image API 3 services are recognized by `type: "ImageService3"` as well as their
image context. Advertised sizes produce canonical `width,height` URLs, including
for level-0 services ([Image API 3 sizes](https://iiif.io/api/image/3.0/#53-sizes)).
Image API 2 candidates retain their canonical width-only URLs.

Custom candidates retain the full image's dimensions so thumbnail requests fit
the requested bounds without changing its aspect ratio. Embedded API 3 services
can use the containing image's dimensions when the service omits them. If no
dimensions are available, the helper uses explicit image URLs or advertised
fixed sizes rather than guessing a square custom size. Scale-factor candidates
use numeric ordering, round dimensions up, and leave shared service arrays unchanged.

```ts
import { createThumbnailHelper } from "@iiif/vault-helpers/thumbnail";

const vault = new Vault();
const helper = createThumbnailHelper(vault);

const thumbnail = helper.getBestThumbnailAtSize(canvas, { width: 256, height: 256 });
// thumbnail.best.id
```

Available options:

```ts
interface Options {
  width?: number;
  height?: number;
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
  fallback?: boolean;
  atAnyCost?: boolean;
  unsafeImageService?: boolean;
  returnAllOptions?: boolean;
  allowUnsafe?: boolean;
  preferFixedSize?: boolean;
  explain?: boolean;
}
```
