# ⚙️ pi-processes

> Agent-facing process manager for Pi and pi-web automation workflows.

`pi-processes` lets the agent start, inspect, restart, and stop long-running commands through a managed `process` tool instead of fragile shell backgrounding.

Designed for use with [jmfederico/pi-web](https://github.com/jmfederico/pi-web).

[![npm](https://img.shields.io/npm/v/@haemmid/pi-processes)](https://www.npmjs.com/package/@haemmid/pi-processes)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)

<p align="center">
  <img src="https://raw.githubusercontent.com/haemmid/pi-processes/v0.9.0/assets/hero.svg" alt="pi-processes managed process workflow" width="760">
</p>

## Why

Agents often waste time or break sessions by running:

- `npm run dev &`
- `nohup pnpm dev ...`
- `pkill -f vite`
- repeated `timeout 10 npm run dev`

This package gives the agent a stable process lifecycle instead:

- `process start`
- `process list`
- `process output`
- `process restart`
- `process kill`

## Table of Contents

- [Features](#features)
- [Install](#install)
- [Usage](#usage)
- [Configuration](#configuration)
- [Tool API](#tool-api)
- [Killing processes](#killing-processes)
- [Limitations](#limitations)
- [Development](#development)
- [Acknowledgements](#acknowledgements)
- [Changelog](#changelog)
- [License](#license)

## Features

- **Agent-facing `process` tool** — start, list, kill, get output, get log paths, and clear managed processes.
- **File-backed logs** — process output is preserved in temp files outside the agent context window.
- **Background-command interception** — optional guardrails steer the agent away from `&`, `nohup`, `&&` and toward the `process` tool.
- **Session cleanup** — managed processes are terminated when the session shuts down.
- **Duplicate name protection** — refuses to spawn if a live process with the same name already exists.
- **Dedicated `restart` action** — safely awaits kill before starting a new process.

## Install

Install from npm:

```bash
pi install npm:@haemmid/pi-processes
```

Install from git:

```bash
pi install git:github.com/haemmid/pi-processes
```

Or install from a local checkout:

```bash
pi install /path/to/pi-processes
```

## Usage

The `process` tool is for the agent, not for direct user input. Ask the agent to start or inspect long-running work.

Example user prompts:

```text
Start the dev server with pnpm dev and call it backend-dev.
Show me the latest output from backend-dev.
Stop the backend-dev process.
```

The agent should start managed processes through the `process` tool instead of running shell backgrounding such as `command &`, `nohup`, `disown`, or `setsid`.

## Astro / Vite workflow

For Astro/Vite dev servers, ask the agent:

```text
Use the process tool for the Astro dev server.
Start `npm run dev -- --host 0.0.0.0` as `my-site:astro`.
Use `process output` when you need logs.
Do not restart after ordinary .astro, .ts, or .css edits.
Restart only after package/config/env changes or if the server exits.
```

Typical tool flow:

```text
process list
process start "npm run dev -- --host 0.0.0.0" name="my-site:astro"
process output id="my-site:astro"
process restart "npm run dev -- --host 0.0.0.0" name="my-site:astro"
process kill id="my-site:astro"
```

## Demo

<p align="center">
  <img src="https://raw.githubusercontent.com/haemmid/pi-processes/v0.9.0/assets/demo-pi-web.gif" alt="pi-processes demo in pi-web" width="760">
</p>

## Configuration

Global config lives in:

```text
~/.pi/agent/extensions/process.json
```

Example:

```json
{
  "output": {
    "defaultTailLines": 100,
    "maxOutputLines": 200
  },
  "execution": {
    "shellPath": "/absolute/path/to/bash"
  },
  "interception": {
    "blockBackgroundCommands": true
  }
}
```

Options:

- `output.defaultTailLines` — default number of lines returned by `process output`.
- `output.maxOutputLines` — hard cap for `process output`.
- `execution.shellPath` — absolute shell path override used for process startup.
- `interception.blockBackgroundCommands` — block shell backgrounding and obvious long-running foreground commands such as `pnpm dev`, `docker compose up`, `tail -f`, or `kubectl port-forward`, and guide the agent to use the `process` tool instead.

## Tool API

The tool is named `process`.

### Actions

| Action | Description |
|--------|-------------|
| `start` | Start a managed process. |
| `restart` | Kill existing process and start a new one (safe: await kill → start). |
| `list` | List managed processes. |
| `output` | Return a one-off tailed stdout/stderr snapshot. |
| `logs` | Return file paths for stdout, stderr, and combined logs. |
| `kill` | Terminate or force-kill a process. |
| `clear` | Remove finished processes from the manager. |

### Tool-call examples

```text
process start "pnpm dev" name="backend-dev"
process start "pnpm test --watch" name="tests"
process start "pnpm dev" name="backend-dev" cwd="/path/to/project"
process restart "pnpm dev" name="backend-dev"
process restart "pnpm dev" name="backend-dev" force=true
process list
process output id="backend-dev"
process logs id="proc_1"
process kill id="backend-dev"
process kill id="proc_1" force=true
process clear
```

### Field rules

- `start`/`restart` require `command` and `name`.
- `output`, `logs`, and `kill` require `id`.
- `kill` accepts `force=true` to send `SIGKILL` instead of `SIGTERM`.
- `start` refuses if a process with the same name is already running.
- `restart` safely kills the existing process (awaited) before starting a new one.
- `restart` accepts `force=true` to send `SIGKILL` instead of `SIGTERM`.
- `start`/`restart` accept `cwd` to override the working directory (defaults to session cwd).

## Killing processes

- `process kill id="..."` sends `SIGTERM`.
- `process kill id="..." force=true` sends `SIGKILL`.
- Tool-triggered kills never notify the agent.

## Limitations

- **Linux/macOS only.** The extension disables itself on Windows.
- **Session-scoped.** Processes are cleaned up on session shutdown.
- **Not a system service manager.** Does not persist process registry across sessions.
- **Manages only tool-started processes.** Does not track externally started processes.
- **No TUI widgets.** Does not provide `/ps` overlays or status widgets.

## Development

There are no Git hooks installed by this repository. Before committing or opening a PR, consider running:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

After dependency changes, also verify the lockfile with:

```bash
pnpm install --frozen-lockfile --ignore-scripts
```

## Acknowledgements

This package started as a fork of [`mjakl/pi-processes`](https://github.com/mjakl/pi-processes), which was based on [`aliou/pi-processes`](https://github.com/aliou/pi-processes). This fork focuses specifically on plain-text, pi-web-friendly, agent-facing process management without TUI widgets or overlays.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

MIT
