import assert from 'node:assert/strict';
import * as vault from '@iiif/helpers/vault-node';
import * as events from '@iiif/helpers/events';
import * as i18n from '@iiif/helpers/i18n';
import * as styles from '@iiif/helpers/styles';
import * as thumbnail from '@iiif/helpers/thumbnail';
import * as annotationTargets from '@iiif/helpers/annotation-targets';
import * as contentState from '@iiif/helpers/content-state';
import * as paintingAnnotations from '@iiif/helpers/painting-annotations';

assert.equal(typeof vault.Vault, 'function');
assert.equal(typeof events.createEventsHelper, 'function');
assert.equal(typeof i18n.getValue, 'function');
assert.equal(typeof styles.createStylesHelper, 'function');
assert.equal(typeof thumbnail.createThumbnailHelper, 'function');
assert.equal(typeof annotationTargets.expandTarget, 'function');
assert.equal(typeof contentState.parseContentState, 'function');
assert.equal(typeof paintingAnnotations.createPaintingAnnotationsHelper, 'function');
