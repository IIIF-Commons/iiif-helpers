const assert = require('node:assert/strict');
const { Vault } = require('@iiif/helpers/vault-node');
const events = require('@iiif/helpers/events');
const i18n = require('@iiif/helpers/i18n');
const styles = require('@iiif/helpers/styles');
const thumbnail = require('@iiif/helpers/thumbnail');
const annotationTargets = require('@iiif/helpers/annotation-targets');
const contentState = require('@iiif/helpers/content-state');
const paintingAnnotations = require('@iiif/helpers/painting-annotations');

const vault = new Vault();

assert.equal(typeof vault.load, 'function');
assert.equal(typeof events.createEventsHelper, 'function');
assert.equal(typeof i18n.getValue, 'function');
assert.equal(typeof styles.createStylesHelper, 'function');
assert.equal(typeof thumbnail.createThumbnailHelper, 'function');
assert.equal(typeof annotationTargets.expandTarget, 'function');
assert.equal(typeof contentState.parseContentState, 'function');
assert.equal(typeof paintingAnnotations.createPaintingAnnotationsHelper, 'function');
