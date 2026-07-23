import type {
  Canvas as CanvasV3,
  Collection as CollectionV3,
  InternationalString as InternationalStringV3,
  Manifest as ManifestV3,
  Range as RangeV3,
} from '@iiif/parser/presentation-3/types';
import type {
  Canvas as CanvasV4,
  Collection as CollectionV4,
  LanguageMap as InternationalStringV4,
  Manifest as ManifestV4,
  Range as RangeV4,
  Scene as SceneV4,
  Timeline as TimelineV4,
} from '@iiif/parser/presentation-4/types';

type InternationalString = InternationalStringV3 | InternationalStringV4;
type LanguageResource =
  | CollectionV3
  | ManifestV3
  | CanvasV3
  | RangeV3
  | CollectionV4
  | ManifestV4
  | CanvasV4
  | RangeV4
  | TimelineV4
  | SceneV4;

export function getClosestLanguage(
  i18nLanguage: string | undefined,
  languages: string[],
  i18nLanguages: string[] = [],
  strictFallback = false,
  skipLanguages: string[] = []
) {
  if (skipLanguages.length) {
    languages = languages.filter((l) => skipLanguages.indexOf(l) === -1);
  }

  if (!languages || languages.length === 0) {
    return undefined;
  }

  // Only one option.
  if (languages.length === 1) {
    return languages[0];
  }

  if (!i18nLanguage) {
    if (languages.indexOf('none') !== -1) {
      return 'none';
    }
    return languages[0];
  }

  // Exact match.
  if (languages.indexOf(i18nLanguage) !== -1) {
    return i18nLanguage;
  }

  // Root match (en-us === en)
  const root = i18nLanguage.indexOf('-') !== -1 ? i18nLanguage.slice(0, i18nLanguage.indexOf('-')) : null;
  if (root && languages.indexOf(root) !== -1) {
    return root;
  }

  // All of the fall backs.
  for (const lang of i18nLanguages) {
    if (languages.indexOf(lang) !== -1) {
      return lang;
    }
  }

  if (!strictFallback && i18nLanguage) {
    // Inverse root match (en === en-us)
    const inverseRoot = languages.map((l) => (l.indexOf('-') !== -1 ? l.slice(0, l.indexOf('-')) : null));
    const inverseIdx = inverseRoot.indexOf(i18nLanguage);
    if (inverseIdx !== -1) {
      return languages[inverseIdx];
    }

    // Inverse root (fallback)
    for (const lang of i18nLanguages) {
      const root = lang.indexOf('-') !== -1 ? lang.slice(0, lang.indexOf('-')) : null;
      const inverseIdx = root ? languages.indexOf(root) : -1;
      if (inverseIdx !== -1) {
        return languages[inverseIdx];
      }
    }
  }

  if (languages.indexOf('none') !== -1) {
    return 'none';
  }

  // Catch some legacy
  if (languages.indexOf('@none') !== -1) {
    return '@none';
  }

  // Finally, fall back to the first.
  return languages[0];
}

export function buildLocaleString(
  inputText: string | InternationalString | null | undefined,
  i18nLanguage: string | undefined,
  options: {
    strictFallback?: boolean;
    defaultText?: string;
    separator?: string;
    fallbackLanguages?: string[];
    closest?: boolean;
    skipLanguages?: string[];
  } = {}
) {
  const {
    strictFallback = false,
    defaultText = '',
    separator = '\n',
    fallbackLanguages = [],
    closest,
    skipLanguages,
  } = options;
  const languages = Object.keys(inputText || {});
  const language = closest
    ? i18nLanguage
    : getClosestLanguage(i18nLanguage, languages, fallbackLanguages, strictFallback, skipLanguages);

  if (!inputText) {
    return defaultText;
  }

  if (typeof inputText === 'string') {
    return inputText;
  }

  const candidateText = language ? inputText[language] : undefined;
  if (candidateText && language) {
    // Slightly tolerant of typos in IIIF like: `{"en": "Some value"}`
    if (typeof candidateText === 'string') {
      return candidateText;
    }
    // Skip empty strings.
    if (candidateText.length === 1 && candidateText[0] === '') {
      const skip: string[] = options.skipLanguages || [];
      return buildLocaleString(inputText, i18nLanguage, {
        ...options,
        skipLanguages: [...skip, language],
      });
    }
    return candidateText.join(separator);
  }

  return '';
}

export function getValue(
  inputText: string | InternationalString | null | undefined,
  options: {
    language?: string;
    defaultText?: string;
    separator?: string;
    fallbackLanguages?: string[];
  } = {}
) {
  return buildLocaleString(
    inputText,
    options.language || (typeof navigator !== 'undefined' ? navigator.language : 'en'),
    options
  );
}

function getLanguagesFromLanguageMap(languageMap: InternationalString) {
  if (!languageMap) return [];
  if (typeof languageMap === 'string') return [];
  if (Array.isArray(languageMap)) return [];
  return Object.keys(languageMap).filter((l) => l !== 'none');
}

export function getAvailableLanguagesFromResource(item: LanguageResource) {
  const foundLanguages = new Set<string>();
  const visited = new WeakSet<object>();

  const addLanguageMap = (value: InternationalString) => {
    getLanguagesFromLanguageMap(value).forEach((language) => foundLanguages.add(language));
  };

  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object') return;
    if (visited.has(value)) return;
    visited.add(value);

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    const resource = value as Record<string, any>;
    if (resource.label) addLanguageMap(resource.label);
    if (resource.summary) addLanguageMap(resource.summary);

    if (typeof resource.language === 'string') {
      foundLanguages.add(resource.language);
    } else if (Array.isArray(resource.language)) {
      resource.language.forEach((language: unknown) => {
        if (typeof language === 'string') foundLanguages.add(language);
      });
    }

    if (resource.requiredStatement && !Array.isArray(resource.requiredStatement)) {
      if (resource.requiredStatement.label) addLanguageMap(resource.requiredStatement.label);
      if (resource.requiredStatement.value) addLanguageMap(resource.requiredStatement.value);
    }

    if (Array.isArray(resource.metadata)) {
      resource.metadata.forEach((entry: Record<string, any>) => {
        if (entry.label) addLanguageMap(entry.label);
        if (entry.value) addLanguageMap(entry.value);
      });
    }

    Object.values(resource).forEach(visit);
  };

  visit(item);
  return Array.from(foundLanguages);
}

export const iiifString = createStringHelper();

export function createStringHelper(
  options: {
    language?: string;
    defaultText?: string;
    separator?: string;
    fallbackLanguages?: string[];
  } = {}
) {
  return (
    template: TemplateStringsArray,
    ...params: Array<null | string[] | undefined | string | InternationalString>
  ) => {
    let result = '';

    for (let i = 0; i < template.length; i++) {
      // Add the template part
      result += template[i];

      // If there's a parameter for this position
      if (i < params.length) {
        const param = params[i];

        if (param === null || param === undefined) {
        } else if (typeof param === 'string') {
          // Add string params directly
          result += param;
        } else {
          // For InternationalString objects, get the value using the getValue function
          // which will handle localization based on the user's language
          result += getValue(param as any, options);
        }
      }
    }

    return result;
  };
}
