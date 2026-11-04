# Releasing @iiif/helpers

## Setup

Merge the workflows into the default branch. In GitHub **Settings → Actions →
General → Workflow permissions**, enable **Allow GitHub Actions to create and
approve pull requests**. The release PR workflow uses the built-in GitHub token;
no personal access token is needed.

In [the npm package settings](https://www.npmjs.com/package/@iiif/helpers/access),
add a GitHub Actions trusted publisher with these exact values:

| Field                | Value          |
| -------------------- | -------------- |
| Organization or user | `IIIF-Commons` |
| Repository           | `iiif-helpers` |
| Workflow filename    | `release.yml`  |
| Environment name     | Leave empty    |
| Allow npm publish    | Enabled        |
| Allow npm dist-tag   | Not needed     |

The publishing job uses GitHub OIDC and npm 11. There is no `NPM_TOKEN` or
`NODE_AUTH_TOKEN` to configure. npm publishes provenance alongside the package.
Keep the workflow filename and repository identity in sync with the npm settings.

New npm trusted publishers must complete their first successful publish within
two days. If the setup expires before the first release, recreate the connection.
Configure it when the first release is ready. Once trusted publishing has worked,
the old npm automation token can be retired without affecting this workflow.

## Draft, review, release

1. Merge the changes intended for the release into the default branch.
2. Run **Actions → Create Release PR → Run workflow** on the default branch,
   choosing `patch`, `minor`, or `major`.
3. Review the draft PR from `release/next`. It changes only the package version
   and includes generated release notes. Re-running the workflow updates the same
   branch rather than creating another release PR. The pnpm lockfile does not
   record the root package version, so it does not need a version-only update.
4. Mark the PR ready and merge when ready to publish. Bot-created PR events do not
   start other workflows with the built-in GitHub token; the release workflow
   independently runs all checks after the human merge.
5. `release.yml` checks out the merge commit, builds, typechecks, checks formatting
   and lint, validates the package, runs tests and loads the ESM/CJS entries.
   It then builds a fresh publishing checkout, publishes to npm using OIDC, and
   creates the matching `v<version>` tag and GitHub release with generated notes.

Only merged `release/next` PRs from this repository into its default branch
trigger automatic publishing. Closing without merging, fork PRs and other branch
names do not publish. The publishing job has `id-token: write`; the check job
has read-only repository permissions. Releases are serialized.

For a prerelease, edit the draft PR's package version to an unused version such
as `4.0.1-next.0` before merging. Prereleases publish under `next` and GitHub marks
their releases as prereleases. Stable versions publish under `latest`.

You can also push a `v<version>` tag manually, provided it matches package.json.
The workflow runs the same checks and publishing steps. Do not push another tag
while a release is running. The package must have a new, unpublished version.

Publishing and automatic tagging happen in the same workflow. Tags created with
`GITHUB_TOKEN` do not trigger another tag-push workflow. No additional npm trusted
publisher is needed for `create-release-pr.yml`.

## Failed releases

If checks or publishing fail, no automatic tag or GitHub release is created.
Fix the failure before retrying. If npm publishing succeeds but GitHub release
creation fails, create the missing release/tag at the workflow's exact commit;
do not republish the same npm version. npm versions cannot be overwritten.
