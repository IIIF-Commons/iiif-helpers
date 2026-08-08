# Objects

This helper aims to make resources from Vault easier to use.

## Loading resources

The objects helper has a similar to API to the main vault API. You can call:

- `load()`
- `loadManifest()`
- `loadCollection()`
- `get`

From the objects helper, and two additional utilities: `wrapObject()` which converts a vault object to a wrapped one and `isWrapped` to check for wrapped objects.

```ts
const vault = new Vault();
const objects = createObjectsHelper(vault);

await vault.loadManifest("https://example.org/manifest"); // As normal

const manifest = objects.get("https://example.org/manifest");

// or.. combined

await objects.loadManifest("https://example.org/manifest");
```

## Resource API

You can access all properties using property accessors like normal JS objects. Any deeper references will be resolved.

```ts
const manifest = objects.get("https://example.org/manifest");

manifest.label; // works
manifest.items[0].label; // also works
```

:::caution

**When you call `manifest.items[0]` this object is created each time. Which results in the following:**

```ts
manifest.items[0] !== manifest.items[0]; // false!
```

:::

Because of the equality issue, there is an additional API for these objects:

```ts
manifest.items[0].is(manifest.items[0]); // true
manifest.items[0].is("https://example.org/canvas-1"); // true
```

Available APIs on all objects:

- `is()` - returns if the resource is another resource (compare string ids or refs or wrapped objects etc.)
- `reactive()` - this will make the object reactive to changes, useful if you are making an editor
- `unreactive()` - turns off reactivity
- `refresh()` - manually refreshes the properties on the manifest
- `unwrap()` - returns the original vault object, can be used for comparing (`objectA.unwrap() === objectB.unwrap()`)
- `toJSON()` - returns the object as a plain object, does not filter out empty properties
- `toPresentation3()` - similar to `toJSON()` but compresses and removes empty properties
- `toPresentation2()` - converts to valid Presentation 2.
- `subscribe()` - Pass a function to that will be called whenever this resource changes - makes the object a compatible store.
