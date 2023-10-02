import { Reference } from '@iiif/presentation-3';
import { compatVault, CompatVault } from './compat';

export type StyleDefinition = Record<string, any>;

export type StyledHelper<S extends StyleDefinition> = {
  applyStyles<Style extends StyleDefinition = S>(resource: any, scope: string, styles: Style[string]): void;
  getAppliedStyles<Style extends StyleDefinition = S>(resource: any): Style | undefined;
};

export function createStylesHelper<S extends StyleDefinition>(vault: CompatVault = compatVault): StyledHelper<S> {
  return {
    applyStyles<Style extends StyleDefinition = S>(
      resource: string | Reference<any>,
      scope: string,
      styles: Style[string]
    ) {
      const id = typeof resource === 'string' ? resource : resource.id;
      return vault.setMetaValue<Style[string]>([id, 'styles', scope], styles);
    },
    getAppliedStyles<Style extends StyleDefinition = S>(resource: string | Reference<any>): Style | undefined {
      const id = typeof resource === 'string' ? resource : resource.id;
      return vault.getResourceMeta<{ styles: Style }, 'styles'>(id, 'styles');
    },
  };
}
