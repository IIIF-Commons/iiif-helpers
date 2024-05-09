import { Traverse } from '@iiif/parser';
import { Canvas, Collection, InternationalString, Manifest } from '@iiif/presentation-3';

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
  options: { language?: string; defaultText?: string; separator?: string; fallbackLanguages?: string[] } = {}
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

export function getAvailableLanguagesFromResource(item: Collection | Manifest | Canvas | Range) {
  const foundLanguages = new Set();

  const findLanguages = Traverse.all((resource) => {
    // List of properties that can contain language.
    // - language
    // - summary
    // - required statement (label, value)
    // - metadata pairs (array of label, value)

    if ('label' in resource) {
      const languages = getLanguagesFromLanguageMap(resource.label);
      languages.forEach((l) => foundLanguages.add(l));
    }

    if ('summary' in resource) {
      const languages = getLanguagesFromLanguageMap(resource.summary);
      languages.forEach((l) => foundLanguages.add(l));
    }

    if (resource.type === 'Annotation') {
      const body = resource.body;
      if (body) {
        if (Array.isArray(body)) {
          for (const b of body) {
            if (b.language) foundLanguages.add(b.language);
          }
        } else {
          if (body && body.language) foundLanguages.add(body.language);
        }
      }
    }

    if ('requiredStatement' in resource) {
      if (resource.requiredStatement && !Array.isArray(resource.requiredStatement)) {
        if ('label' in resource.requiredStatement) {
          const languages = getLanguagesFromLanguageMap(resource.requiredStatement.label);
          languages.forEach((l) => foundLanguages.add(l));
        }
        if ('value' in resource.requiredStatement) {
          const languages = getLanguagesFromLanguageMap(resource.requiredStatement.value);
          languages.forEach((l) => foundLanguages.add(l));
        }
      }
    }

    if ('metadata' in resource) {
      if (Array.isArray(resource.metadata)) {
        (resource.metadata as any[]).forEach((m) => {
          if ('label' in m) {
            const languages = getLanguagesFromLanguageMap(m.label);
            languages.forEach((l) => foundLanguages.add(l));
          }
          if ('value' in m) {
            const languages = getLanguagesFromLanguageMap(m.value);
            languages.forEach((l) => foundLanguages.add(l));
          }
        });
      }
    }
  });

  findLanguages.traverseUnknown(item);

  return Array.from(foundLanguages);
}
