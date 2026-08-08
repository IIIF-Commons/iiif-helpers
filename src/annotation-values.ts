export type AnnotationAggregateType = 'Choice' | 'Composite' | 'List' | 'Independents';

export type AnnotationAggregateStep = {
  type: AnnotationAggregateType;
  index: number;
};

export type ResolvedAnnotationValue = {
  value: unknown;
  aggregatePath: AnnotationAggregateStep[];
  aggregateDefaults: Array<number | undefined>;
  specificResources: unknown[];
};

export type AnnotationValueResolver = (value: unknown) => unknown;

const aggregateTypes = new Set<AnnotationAggregateType>(['Choice', 'Composite', 'List', 'Independents']);

/**
 * Flattens annotation aggregates in document order while retaining their
 * aggregate path and any SpecificResource wrappers around each value.
 */
export function resolveAnnotationValues(
  input: unknown,
  resolve: AnnotationValueResolver = (value) => value
): ResolvedAnnotationValue[] {
  return visit(Array.isArray(input) ? input : [input], [], [], [], resolve);
}

function visit(
  values: unknown[],
  aggregatePath: AnnotationAggregateStep[],
  aggregateDefaults: Array<number | undefined>,
  specificResources: unknown[],
  resolve: AnnotationValueResolver
): ResolvedAnnotationValue[] {
  const resolved: ResolvedAnnotationValue[] = [];

  for (const unresolved of values) {
    const value = resolve(unresolved) ?? unresolved;
    if (isAggregate(value)) {
      const defaultIndex = value.type === 'Choice' ? choiceDefaultIndex(value, resolve) : undefined;
      value.items.forEach((item, index) => {
        resolved.push(
          ...visit(
            [item],
            [
              ...aggregatePath,
              { type: value.type, index },
            ],
            [...aggregateDefaults, defaultIndex],
            specificResources,
            resolve
          )
        );
      });
    } else if (isSpecificResource(value)) {
      resolved.push(
        ...visit([value.source], aggregatePath, aggregateDefaults, [...specificResources, value], resolve)
      );
    } else {
      resolved.push({ value, aggregatePath, aggregateDefaults, specificResources });
    }
  }

  return resolved;
}

function isAggregate(value: unknown): value is { type: AnnotationAggregateType; items: unknown[]; default?: unknown } {
  return (
    !!value &&
    typeof value === 'object' &&
    aggregateTypes.has((value as { type?: AnnotationAggregateType }).type as AnnotationAggregateType) &&
    Array.isArray((value as { items?: unknown[] }).items)
  );
}

function choiceDefaultIndex(
  choice: { items: unknown[]; default?: unknown },
  resolve: AnnotationValueResolver
): number | undefined {
  if (choice.default == null) return undefined;
  const defaultValue = resolve(choice.default) ?? choice.default;
  const defaultId = referenceId(defaultValue);
  const index = choice.items.findIndex((item) => {
    const value = resolve(item) ?? item;
    return value === defaultValue || (!!defaultId && referenceId(value) === defaultId);
  });
  return index === -1 ? undefined : index;
}

function referenceId(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  return value && typeof value === 'object' && typeof (value as { id?: unknown }).id === 'string'
    ? (value as { id: string }).id
    : undefined;
}

function isSpecificResource(value: unknown): value is { type?: 'SpecificResource'; source: unknown } {
  if (!value || typeof value !== 'object' || !('source' in value)) {
    return false;
  }

  const type = (value as { type?: string }).type;
  return type === undefined || type === 'SpecificResource';
}
