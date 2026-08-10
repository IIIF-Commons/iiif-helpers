# Styles helper

The styles helper is glue that can be used between two parts of an application to both define and apply style
information associated with IIIF resources, such as Annotations. The styles helper uses Vaults "meta" feature to
store this extra style information.

**Example usage**

```ts
import { createStyleHelper } from "@iiif/vault-helpers/styles";

const vault = new Vault();
const styles = createStyleHelper(vault);

const manifest = { id: "https://example.org/manifest-1", type: "Manifest" };

// Apply a style somewhere you in your app
styles.applyStyle(
  manifest,
  {
    background: "red",
  },
  "scope-1"
);

// Somewhere else..
styles.applyStyle(
  manifest,
  {
    someCustomStyle: "foo",
  },
  "scope-2"
);

// Where you render:
const applied = styles.getAppliedStyles(manifest);
// {
//  'scope-1': { background: 'red' },
//  'scope-2': { someCustomStyle: 'foo' }
// }
```
