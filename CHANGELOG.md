# Changelog

All notable changes to this project will be documented in this file.

This project follows semantic versioning for public releases.

## [0.9.2] - 2026-07-02

### Added

- `ensure` action for idempotent dev-server workflows.
- `ensure` reuses existing process when name+command+cwd match.
- `ensure` returns conflict error when name matches but configuration differs.
- `ensure` returns next commands (output/logs/restart/kill by name).

### Changed

- Version bumped to 0.9.2.

## [0.9.1] - 2026-07-02

### Added

- `output`, `logs`, and `kill` accept either `id` or `name` as process selector.
- `start` and `restart` return suggested next commands with `name="..."`.
- Shared `resolveSelector` utility for consistent validation across actions.

### Changed

- Ambiguous name resolution now uses simpler error messages.
- Tool description updated to mention id/name duality.

### Fixed

- `kill` test: message assertion updated for new ambiguous error format.

## [0.9.0] - 2026-07-01

Initial public release of `@haemmid/pi-processes`.

### Added

- Agent-facing `process` tool for Pi and pi-web automation workflows.
- Managed process actions:
  - `start`
  - `restart`
  - `list`
  - `output`
  - `logs`
  - `kill`
  - `clear`
- File-backed stdout/stderr/combined logs.
- Stable process names for dev-server workflows.
- Duplicate running-name protection before spawning a process.
- Dedicated safe `restart` action: await kill, then start.
- `cwd` support for `start` and `restart`.
- Background-command interception for fragile shell patterns:
  - `&`
  - `nohup`
  - `disown`
  - `setsid`
  - `npm run dev`
  - `pnpm dev`
  - `yarn dev`
  - `bun run dev`
  - `npx vite`
  - `npx astro dev`
  - `docker compose up`
  - `tail -f`
  - `kubectl port-forward`
- Session cleanup for managed processes.

### Changed

- Repositioned the package as a plain-text process manager for Pi/pi-web automation.
- Simplified the original process-management workflow for agent use.
- README now focuses on dev-server automation, especially Astro/Vite workflows.
- Process name resolution now prioritizes live processes over old finished duplicates.

### Removed

- TUI widgets and overlays.
- `/ps` overlay workflow.
- Status widgets.
- Rich TUI rendering in tool output.
- Auto-notification claims after process exit.
- Unneeded TUI dependencies.

### Notes

This package started as a fork of `mjakl/pi-processes`, which was based on `aliou/pi-processes`.

This release focuses on a narrower use case: reliable, plain-text, agent-facing process management for automated Pi and pi-web coding workflows.
