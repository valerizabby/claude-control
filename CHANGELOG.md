# Changelog

All notable user-facing changes are recorded here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions match `package.json`.

## [Unreleased]

### Added

- Sessions running in IDE integrated terminals (VS Code, Cursor, Windsurf, JetBrains IDEs) are
  detected. **Focus** brings the IDE to the front and raises the window of the session's project.
- Session cards and list rows show where the session runs (e.g. `GoLand`, `Terminal`,
  `GoLand · tmux: api`).
- **Run in tmux** checkbox in the New Session dialog to override the Settings value per session.

### Changed

- **Create PR**, **Quick Reply**, approve/reject and **Focus** now show an error when the session's
  terminal can't receive input (e.g. an IDE terminal without tmux), instead of silently doing nothing.
- For such sessions, **Create PR**, **Quick Reply**, approve/reject and the `a`/`x` shortcuts are
  now disabled up front, and hovering over them explains why and suggests running the session in tmux.

### Fixed

- **Editor** no longer fails with "Action failed" when the editor app is installed but its CLI
  (`code`, `idea`, …) isn't in `PATH`; the app is opened directly.
- The hooks installer no longer overwrites `~/.claude/settings.json` when it isn't valid JSON. It now
  keeps a `.bak` copy, writes atomically, and follows symlinks.
