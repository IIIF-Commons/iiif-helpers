const { Vault } = require('@iiif/helpers/vault-node');
const events = require('@iiif/helpers/events');
const i18n = require('@iiif/helpers/i18n');
const styles = require('@iiif/helpers/styles');
const thumbnail = require('@iiif/helpers/thumbnail');
const annotationTargets = require('@iiif/helpers/annotation-targets');
const contentState = require('@iiif/helpers/content-state');
const paintingAnnotations = require('@iiif/helpers/painting-annotations');

const vault = new Vault();

console.log(vault);
console.log(events);
console.log(i18n);
console.log(styles);
console.log(thumbnail);
console.log(annotationTargets);
console.log(contentState);
console.log(paintingAnnotations);

const helper = thumbnail.createThumbnailHelper(vault);

vault.load('https://wellcomelibrary.org/iiif/b18035723/manifest').then(() => {
  helper
    .getBestThumbnailAtSize(
      { id: 'https://iiif.wellcomecollection.org/presentation/b18035723/canvases/b18035723_0001.JP2', type: 'Canvas' },
      {
        height: 300,
        width: 300,
      }
    )
    .then((resp) => {
      console.log(resp);
    });
});
