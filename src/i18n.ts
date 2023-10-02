import { InternationalString } from '@iiif/presentation-3';

export function getClosestLanguage(
  i18nLanguage: string,
  languages: string[],
  i18nLanguages: string[] = [],
  strictFallback = false
) {
  if (!i18nLanguage || !languages || languages.length === 0) {
    return undefined;
  }

  // Only one option.
  if (languages.length === 1) {
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

  if (!strictFallback) {
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
  } = {}
) {
  const { strictFallback = false, defaultText = '', separator = '\n', fallbackLanguages = [], closest } = options;
  const languages = Object.keys(inputText || {});
  const language = closest
    ? i18nLanguage
    : getClosestLanguage(i18nLanguage as any, languages, fallbackLanguages, strictFallback);

  if (!inputText) {
    return defaultText;
  }

  if (typeof inputText === 'string') {
    return inputText;
  }

  const candidateText = language ? inputText[language] : undefined;
  if (candidateText) {
    // Slightly tolerant of typos in IIIF like: `{"en": "Some value"}`
    if (typeof candidateText === 'string') {
      return candidateText;
    }
    return candidateText.join(separator);
  }

  return '';
}

export function getValue(
  inputText: string | InternationalString | null | undefined,
  options: { defaultText?: string; separator?: string; fallbackLanguages?: string[] } = {}
) {
  return buildLocaleString(inputText, typeof navigator !== 'undefined' ? navigator.language : 'en', options);
}
