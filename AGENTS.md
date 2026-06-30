# pi-processes

Public Pi extension for managing background processes. This is a fork of [mjakl/pi-processes](https://github.com/mjakl/pi-processes), which is a fork of [aliou/pi-processes](https://github.com/aliou/pi-processes).

## Tool and command audience

The `process` tool is for **LLM use only**, not for users directly. Users should never start background processes — that is the agent's job.

During UI tests that require processes to be running, either give the user a prompt to send to the agent (which will start the processes via the `process` tool), or use tmux to drive it programmatically. Never instruct the user to run shell commands manually.

## Stack

- TypeScript (strict mode), pnpm 10.26.1, Biome

## Scripts

- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm format`

## Structure

- `src/index.ts` - entry
- `src/manager.ts` - process manager (spawn, lifecycle, events)
- `src/config.ts` - config loader
- `src/constants/` - types and constants
- `src/tools/` - tool actions (start, restart, list, output, logs, kill, clear)
- `src/hooks/` - event hooks (cleanup, background-blocker)
- `src/utils/` - helpers (command-executor, process-group, format, ansi)
- `test/` - test scripts
