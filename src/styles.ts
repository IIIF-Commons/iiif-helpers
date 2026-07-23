import type { Reference as ReferenceV3 } from '@iiif/parser/presentation-3/types';
import type { Reference as ReferenceV4 } from '@iiif/parser/presentation-4/types';
import { type CompatVault, compatVault } from './compat';

export type StyleDefinition = Record<string, any>;
type AnyReference = ReferenceV3<any> | ReferenceV4<any>;

export type StyledHelper<S extends StyleDefinition> = {
  applyStyles<Style extends StyleDefinition = S>(resource: any, scope: string, styles: Style[string]): void;
  getAppliedStyles<Style extends StyleDefinition = S>(resource: any): Style | undefined;
};

export function createStylesHelper<S extends StyleDefinition>(vault: CompatVault = compatVault): StyledHelper<S> {
  return {
    applyStyles<Style extends StyleDefinition = S>(
      resource: string | AnyReference,
      scope: string,
      styles: Style[string]
    ) {
      const id = typeof resource === 'string' ? resource : resource.id;
      return vault.setMetaValue<Style[string]>([id, 'styles', scope], styles);
    },
    getAppliedStyles<Style extends StyleDefinition = S>(resource: string | AnyReference): Style | undefined {
      const id = typeof resource === 'string' ? resource : resource.id;
      return vault.getResourceMeta<{ styles: Style }, 'styles'>(id, 'styles');
    },
  };
}
