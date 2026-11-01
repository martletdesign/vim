# Native release preparation

The proposed tag workflow is disabled at both jobs and only prepares and verifies native ZIP artifacts. It does not publish to a store or create a GitHub Release. It requires a protected tag, tag/source/private-build-manifest version and repository identity, unchanged remote tag, and a commit on the first-parent history of main. The existing native build and verification run before checksummed archives are uploaded as temporary GitHub Actions artifacts.

Before any activation, an administrator must verify immutable `v*` rulesets, approved main merges, required reviewers, release recovery, source-branch controls, and protection of release workflow changes. `github.ref_protected` cannot by itself establish that updates, deletion and bypass are prohibited. Account for historical tags; do not move or reuse them. Verify the native package format and exact file inventory independently. The existing npm manifest is a private build helper, not an npm publication target.

Vim and Emacs consumers use native Git/plugin installations; decide whether and how a GitHub Release should accompany a protected tag. Chrome ZIPs are unsigned Web Store submission archives. Firefox ZIPs require Mozilla signing for permanent installation. Store account access, review, signing, channel/version policy, provenance and rollback require their own design and authorization. This artifact-only draft deliberately does not claim to implement those native publication steps.


The proposed GitHub Release job is disabled. It checks the protected tag and the downloaded archive checksums, refuses an existing or unverifiable release, and uses `gh release create --verify-tag` without overwriting assets. It re-downloads the released assets and compares their exact bytes. Prerelease tags create prereleases. Chrome and Firefox ZIPs are unsigned review artifacts, not store submissions.

If creation succeeds but a runner loses the result, do not retry blindly: inspect the existing release, tag object, asset names and SHA256SUMS. Re-download and hash every asset before deciding whether the release is complete. Resolve a mismatch manually under separate authorization; never overwrite a historical release as automatic recovery. Immutable tag and release rules must be configured separately before activation.
