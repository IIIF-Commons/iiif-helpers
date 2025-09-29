import { parseCssToBoxStyleMap } from '../src/annotation-targets/css-selectors';

describe('CSS Selectors', () => {
  test('simple selector', () => {
    expect(parseCssToBoxStyleMap('.test { background: red }')).toMatchInlineSnapshot(`
      {
        "test": {
          "background": "red",
        },
      }
    `);
  });

  test('Cookbook example', () => {
    const css = `
      .author1 {
        color: #f00;
        background-color: #fff;
        border-color: #f00;
      }

      .author2 {
        color: #1a1;
        background-color: #fff;
        border-color: #0f0;
      }
    `;

    expect(parseCssToBoxStyleMap(css)).toMatchInlineSnapshot(`
      {
        "author1": {
          "backgroundColor": "#fff",
          "borderColor": "#f00",
        },
        "author2": {
          "backgroundColor": "#fff",
          "borderColor": "#0f0",
        },
      }
    `);
  });
});
