# pi-processes (fork)

**Manage long-running commands from Pi without blocking the conversation.**

This is a fork of [mjakl/pi-processes](https://github.com/mjakl/pi-processes), which is itself a fork of [aliou/pi-processes](https://github.com/aliou/pi-processes).

**Goal of this fork:** strip everything unnecessary for an automated workflow where the agent manages dev servers. No TUI, no `/ps` overlay, no status widgets — just the core process tool and session cleanup.

## Features

- **Agent-facing `process` tool** — start, list, kill, get output, get log paths, and clear managed processes.
- **File-backed logs** — process output is preserved in temp files outside the agent context window.
- **Background-command interception** — optional guardrails steer the agent away from `&`, `nohup`, `&&` and toward the `process` tool.
- **Session cleanup** — managed processes are terminated when the session shuts down.

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

## Using Pi Processes

The `process` tool is for the agent, not for direct user input. Ask the agent to start or inspect long-running work.

Example user prompts:

```text
Start the dev server with pnpm dev and call it backend-dev.
Show me the latest output from backend-dev.
Stop the backend-dev process.
```

The agent should start managed processes through the `process` tool instead of running shell backgrounding such as `command &`, `nohup`, `disown`, or `setsid`.

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

Actions:

- `start` — start a managed process.
- `list` — list managed processes.
- `output` — return a one-off tailed stdout/stderr snapshot.
- `logs` — return file paths for stdout, stderr, and combined logs.
- `kill` — terminate or force-kill a process.
- `clear` — remove finished processes from the manager.

Tool-call examples:

```text
process start "pnpm dev" name="backend-dev"
process start "pnpm test --watch" name="tests"
process list
process output id="backend-dev"
process logs id="proc_1"
process kill id="backend-dev"
process kill id="proc_1" force=true
process clear
```

Field rules:

- `start` requires `command` and `name`.
- `output`, `logs`, and `kill` require `id`.
- `kill` accepts `force=true` to send `SIGKILL` instead of `SIGTERM`.

## Killing processes

- `process kill id="..."` sends `SIGTERM`.
- `process kill id="..." force=true` sends `SIGKILL`.
- Tool-triggered kills never notify the agent.

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

## License

MIT
