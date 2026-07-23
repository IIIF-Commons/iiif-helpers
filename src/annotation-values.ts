export type AnnotationAggregateType = 'Choice' | 'Composite' | 'List' | 'Independents';

export type AnnotationAggregateStep = {
  type: AnnotationAggregateType;
  index: number;
};

export type ResolvedAnnotationValue = {
  value: unknown;
  aggregatePath: AnnotationAggregateStep[];
  specificResources: unknown[];
};

const aggregateTypes = new Set<AnnotationAggregateType>(['Choice', 'Composite', 'List', 'Independents']);

/**
 * Flattens annotation aggregates in document order while retaining their
 * aggregate path and any SpecificResource wrappers around each value.
 */
export function resolveAnnotationValues(input: unknown): ResolvedAnnotationValue[] {
  return visit(Array.isArray(input) ? input : [input], [], []);
}

function visit(
  values: unknown[],
  aggregatePath: AnnotationAggregateStep[],
  specificResources: unknown[]
): ResolvedAnnotationValue[] {
  const resolved: ResolvedAnnotationValue[] = [];

  for (const value of values) {
    if (isAggregate(value)) {
      value.items.forEach((item, index) => {
        resolved.push(...visit([item], [...aggregatePath, { type: value.type, index }], specificResources));
      });
    } else if (isSpecificResource(value)) {
      resolved.push(...visit([value.source], aggregatePath, [...specificResources, value]));
    } else {
      resolved.push({ value, aggregatePath, specificResources });
    }
  }

  return resolved;
}

function isAggregate(value: unknown): value is { type: AnnotationAggregateType; items: unknown[] } {
  return (
    !!value &&
    typeof value === 'object' &&
    aggregateTypes.has((value as { type?: AnnotationAggregateType }).type as AnnotationAggregateType) &&
    Array.isArray((value as { items?: unknown[] }).items)
  );
}

function isSpecificResource(value: unknown): value is { type?: 'SpecificResource'; source: unknown } {
  if (!value || typeof value !== 'object' || !('source' in value)) {
    return false;
  }

  const type = (value as { type?: string }).type;
  return type === undefined || type === 'SpecificResource';
}
