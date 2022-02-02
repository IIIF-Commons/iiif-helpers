import { buildLocaleString } from '../src/i18n';
describe('i18n helper', () => {
  describe('buildLocaleString()', () => {
    test('it can empty values', () => {
      expect(buildLocaleString(null, 'none')).toEqual('');
      expect(buildLocaleString(undefined, 'none')).toEqual('');
      expect(buildLocaleString({}, 'none')).toEqual('');
      expect(buildLocaleString('', 'none')).toEqual('');
    });

    test('it can match exact languages', () => {
      expect(buildLocaleString({ none: ['A'] }, 'none')).toEqual('A');
      expect(buildLocaleString({ en: ['A'] }, 'en')).toEqual('A');
      expect(buildLocaleString({ 'en-GB': ['A'] }, 'en-GB')).toEqual('A');
      expect(buildLocaleString({ DIFF: ['_'], none: ['A'] }, 'none')).toEqual('A');
      expect(buildLocaleString({ en: ['A'], DIFF: ['_'] }, 'en')).toEqual('A');
      expect(buildLocaleString({ DIFF: ['_'], 'en-GB': ['A'] }, 'en-GB')).toEqual('A');
    });

    test('it can match partial languages', () => {
      expect(buildLocaleString({ en: ['A'], none: ['_'] }, 'en-GB')).toEqual('A');
      expect(buildLocaleString({ en: ['A'], none: ['_'] }, 'en-US')).toEqual('A');
      expect(buildLocaleString({ 'en-GB': ['A'], none: ['_'] }, 'en')).toEqual('A');
      expect(buildLocaleString({ 'en-US': ['A'], none: ['_'] }, 'en')).toEqual('A');
    });

    test('wont match partial, if strict', () => {
      expect(buildLocaleString({ 'en-GB': ['A'], none: ['A'] }, 'en', { strictFallback: true })).toEqual('A');
      expect(buildLocaleString({ 'en-US': ['A'], none: ['A'] }, 'en', { strictFallback: true })).toEqual('A');
    });

    test('it can match fallback languages', () => {
      expect(buildLocaleString({ en: ['A'], none: ['_'] }, 'cy-GB', { fallbackLanguages: ['en-GB'] })).toEqual('A');
      expect(buildLocaleString({ en: ['_'], none: ['A'] }, 'cy-GB', { fallbackLanguages: [] })).toEqual('A');
      expect(buildLocaleString({ en: ['_'], none: ['A'], '@none': ['_'] }, 'cy-GB', { fallbackLanguages: [] })).toEqual(
        'A'
      );
      expect(buildLocaleString({ en: ['_'], '@none': ['A'] }, 'cy-GB', { fallbackLanguages: [] })).toEqual('A');
    });

    test('multiple values with separators', () => {
      expect(buildLocaleString({ none: ['A', 'B'] }, 'none')).toEqual('A\nB');
      expect(buildLocaleString({ none: ['A', 'B'] }, 'none', { separator: '' })).toEqual('AB');
      expect(buildLocaleString({ none: ['A', 'B'] }, 'none', { separator: '<br/>' })).toEqual('A<br/>B');
      expect(buildLocaleString({ none: ['A', 'B', 'C', 'D', 'E'] }, 'none', { separator: ' ' })).toEqual('A B C D E');
    });
  });
});
