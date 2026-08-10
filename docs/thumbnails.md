# Thumbnails

:::danger
This helper is still a work in progress. It may return thumbnails that are not optimized for delivery by image services
and be slower to load.
:::

Work-in-progress vault-driven thumbnails.

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
