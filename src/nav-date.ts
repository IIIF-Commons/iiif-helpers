// Parse nav date fields and create a navigation tree.
// Decades, years, months, and days are supported.
// Manifests or Canvases can have a property like:
// "navDate": "1986-01-01T00:00:00+00:00"
// "navDate": "1987-01-01T00:00:00+00:00"

import { Collection, InternationalString, Manifest } from '@iiif/presentation-3';
import { CompatVault } from './compat';
import { CollectionNormalized, ManifestNormalized } from '@iiif/presentation-3-normalized';

interface DateNavigationResource {
  id: string;
  type: 'Manifest' | 'Canvas';
  count: number;
  label: InternationalString;
  navDate: string;
}

interface DateNavigationDay {
  id: string;
  type: 'day';
  count: number;
  label: InternationalString;
  day: number;
  items: Array<DateNavigationResource>;
}

interface DateNavigationMonth {
  id: string;
  type: 'month';
  month: number;
  count: number;
  label: InternationalString;
  items: Array<DateNavigationDay>;
}

interface DateNavigationYear {
  id: string;
  type: 'year';
  year: number;
  count: number;
  label: InternationalString;
  items: Array<DateNavigationMonth>;
}

interface DateNavigationDecade {
  id: string;
  type: 'decade';
  yearStart: number;
  yearEnd: number;
  label: InternationalString;
  count: number;
  items: Array<DateNavigationYear>;
}

interface DateNavigationCentury {
  id: string;
  type: 'century';
  yearStart: number;
  yearEnd: number;
  label: InternationalString;
  count: number;
  items: Array<DateNavigationDecade>;
}

type DateNavigationTypes =
  | DateNavigationCentury
  | DateNavigationDecade
  | DateNavigationYear
  | DateNavigationMonth
  | DateNavigationDay;

export function createDateNavigation<T extends DateNavigationTypes, Type = T['type']>(
  vault: CompatVault,
  manifestOrCollection: Manifest | Collection | ManifestNormalized | CollectionNormalized | string,
  inputType?: Type
) {
  const type = inputType || 'century';
  const items: T[] = [];

  const centuries: DateNavigationCentury[] = [];

  const resource = vault.get<any>(manifestOrCollection) as {
    label?: InternationalString;
    id: string;
    items: Array<{
      id: string;
      type: string;
      label?: InternationalString;
      navDate?: string;
    }>;
  };

  if (!resource.items) {
    return items;
  }

  for (const item of resource.items) {
    if (item.navDate) {
      const d = new Date(item.navDate);
      const year = d.getFullYear();
      const month = d.getMonth();
      const day = d.getDate();
      const decade = Math.floor(year / 10) * 10;
      const century = Math.floor(year / 100) * 100;
      let centuryItem = centuries.find((i) => i.yearStart === century);
      if (!centuryItem) {
        centuryItem = {
          id: `${resource.id}/century/${century}`,
          label: { en: [`${century} - ${century + 99}`] },
          type: 'century',
          yearStart: century,
          yearEnd: century + 99,
          count: 1,
          items: [],
        };
        if (type === 'century') {
          items.push(centuryItem as T);
        }
        centuries.push(centuryItem);
      }

      let decadeItem = centuryItem.items.find((i) => i.yearStart === decade);
      if (!decadeItem) {
        decadeItem = {
          id: `${resource.id}/decade/${decade}`,
          label: { en: [`${decade} - ${decade + 9}`] },
          type: 'decade',
          yearStart: decade,
          yearEnd: decade + 9,
          count: 1,
          items: [],
        };
        centuryItem.items.push(decadeItem);
        if (type === 'decade') {
          items.push(decadeItem as T);
        }
      }
      let yearItem = decadeItem.items.find((i) => i.year === year);
      if (!yearItem) {
        yearItem = {
          id: `${resource.id}/year/${year}`,
          label: { en: [`${year}`] },
          type: 'year',
          year: year,
          count: 1,
          items: [],
        };
        decadeItem.items.push(yearItem);
        if (type === 'year') {
          items.push(yearItem as T);
        }
      }
      let monthItem = yearItem.items.find((i) => i.month === month);
      if (!monthItem) {
        monthItem = {
          id: `${resource.id}/month/${month}`,
          // Month as string
          label: {
            en: [
              type === 'month'
                ? `${d.toLocaleString('default', { month: 'long' })} ${year}`
                : `${d.toLocaleString('default', { month: 'long' })}`,
            ],
          },
          type: 'month',
          month: month,
          count: 1,
          items: [],
        };
        yearItem.items.push(monthItem);
        if (type === 'month') {
          items.push(monthItem as T);
        }
      }
      let dayItem = monthItem.items.find((i) => i.day === day);
      if (!dayItem) {
        dayItem = {
          id: `${resource.id}/day/${day}`,
          label: { en: [`${d.toDateString()}`] },
          type: 'day',
          day: day,
          count: 1,
          items: [],
        };
        monthItem.items.push(dayItem);
        if (type === 'day') {
          items.push(dayItem as T);
        }
      }
      dayItem.items.push({
        id: item.id,
        type: item.type as any,
        label: item.label || { en: [`${year}-${month + 1}-${day}`] },
        navDate: item.navDate,
        count: 1,
      });
    }
  }

  if (!inputType) {
    // Filter until there's more than one per level.
    let autoItem = items;
    while (autoItem.length === 1) {
      autoItem = autoItem[0].items as T[];
    }
    return autoItem;
  }

  return items;
}
