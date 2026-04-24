import {
  getSelectorTransformAttributes,
  parseCssToBoxStyleMap,
  parseCssTransformStyle,
} from '../src/annotation-targets/css-selectors';

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

  test('Cookbook rotation transform', () => {
    const css = `.rotated { transform-origin: 761px 1344px; transform: rotate(90deg) translateY(-582px); }`;

    expect(parseCssToBoxStyleMap(css)).toMatchInlineSnapshot(`
      {
        "rotated": {
          "transform": "rotate(90deg) translateY(-582px)",
          "transformOrigin": "761px 1344px",
        },
      }
    `);

    const style = parseCssToBoxStyleMap(css).rotated;

    expect(parseCssTransformStyle(style)).toEqual({
      rotation: 90,
      rotationOrigin: { x: 761, y: 1344, unit: 'pixel' },
      transform: 'rotate(90deg) translateY(-582px)',
      transformOrigin: '761px 1344px',
      translate: { x: 0, y: -582, unit: 'pixel' },
    });
    expect(getSelectorTransformAttributes(style)).toEqual({
      rotation: 90,
      rotationOrigin: { x: 761, y: 1344, unit: 'pixel' },
      transform: {
        rotation: 90,
        rotationOrigin: { x: 761, y: 1344, unit: 'pixel' },
        transform: 'rotate(90deg) translateY(-582px)',
        transformOrigin: '761px 1344px',
        translate: { x: 0, y: -582, unit: 'pixel' },
      },
      translate: { x: 0, y: -582, unit: 'pixel' },
    });
  });
});
