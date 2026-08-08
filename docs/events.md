# Events helper

Events let you bind browser events to IIIF resources, potentially before they are rendered in the DOM. You still have
to bind the events, but those events could come from many sources.

Useful in UI frameworks where an alternative may be to drill down props through layers of components.

```tsx
import { createEventsHelper } from "@iiif/vault-helpers/styles";

const vault = new Vault();
const events = createEventsHelper(vault);

const annotation = { id: "https://example.org/anno-1", type: "Annotation" };

// You can bind multiple callbacks to a single event.
events.addEventListener(annotation, "onClick", () => {
  console.log("Anno clicked");
});

// Where you render:
const props = events.getListenersAsProps(annotation);
$el.addEventListener("click", props.onClick);

// In React this might look like:
<div className="anno" {...props} />;
```

### Supported events

Currently, the events helper does not parse the value of the event passed to `addEventListener` and will simply
combine them into the same property. So can name the event whatever you require for your application. For example, you
could create a `onAnnotationSelected` event that is passed down to a custom component.

This can be a useful way to bake in an extension point for your viewers or libraries.
