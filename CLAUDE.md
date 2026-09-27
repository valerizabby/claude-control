# CLAUDE.md

## Language

Everything that gets pushed to the remote — code comments, docs (`README.md`, `docs/`,
`CONTRIBUTING.md`, etc.), commit messages, PR titles and descriptions — must be written
in English. Local, untracked notes (e.g. `_worklog/`) may be in any language.

## Release notes

Every user-facing change adds an entry to `CHANGELOG.md` under `## [Unreleased]`
(Added / Changed / Fixed / Removed), in the same PR as the change. On a version bump,
rename `[Unreleased]` to the new version with the date and start a fresh `[Unreleased]`.
