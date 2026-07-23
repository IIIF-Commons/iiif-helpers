# CollectionPage coverage

These fixtures are strict Presentation 4 documents and are validated before
the Vault assertions run.

`Vault4` stores `CollectionPage` as its own entity type. Loading a Collection
normalizes its page references as stubs, but does not fetch `first`, `last`,
`next`, or `prev`; applications explicitly load the page documents they need.
