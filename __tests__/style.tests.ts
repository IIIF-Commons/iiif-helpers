import { Vault } from '../src/vault';
import { createStylesHelper } from '../src/styles';
import { describe, expect, test } from 'vitest';

describe('style helper', function () {
  test('setting styles', () => {
    const vault = new Vault();
    const helper = createStylesHelper(vault);
    let times = 0;
    vault.subscribe(
      (s) => s,
      () => {
        times++;
      },
      true
    );

    helper.applyStyles({ id: 'https://example.org/manifest-1' }, 'scope-1', {
      background: 'red',
    });
    helper.applyStyles({ id: 'https://example.org/manifest-1' }, 'scope-2', {
      background: 'green',
    });
    helper.applyStyles({ id: 'https://example.org/manifest-2' }, 'scope-1', {
      background: 'blue',
    });

    expect(times).toEqual(3);
    expect(helper.getAppliedStyles({ id: 'https://example.org/manifest-1' })).toMatchInlineSnapshot(`
      {
        "scope-1": {
          "background": "red",
        },
        "scope-2": {
          "background": "green",
        },
      }
    `);
    expect(helper.getAppliedStyles({ id: 'https://example.org/manifest-2' })).toMatchInlineSnapshot(`
      {
        "scope-1": {
          "background": "blue",
        },
      }
    `);
  });

  test('works with batching', () => {
    const vault = new Vault();
    const helper = createStylesHelper(vault);
    let times = 0;
    vault.subscribe(() => {
      times++;
    }, true);

    vault.batch((v) => {
      helper.applyStyles({ id: 'https://example.org/manifest-1' }, 'scope-1', {
        background: 'red',
      });
      helper.applyStyles({ id: 'https://example.org/manifest-1' }, 'scope-2', {
        background: 'green',
      });
      helper.applyStyles({ id: 'https://example.org/manifest-2' }, 'scope-1', {
        background: 'blue',
      });
    });

    expect(times).toEqual(1);
    expect(helper.getAppliedStyles({ id: 'https://example.org/manifest-1' })).toMatchInlineSnapshot(`
      {
        "scope-1": {
          "background": "red",
        },
        "scope-2": {
          "background": "green",
        },
      }
    `);
    expect(helper.getAppliedStyles({ id: 'https://example.org/manifest-2' })).toMatchInlineSnapshot(`
      {
        "scope-1": {
          "background": "blue",
        },
      }
    `);
  });
});
