# pi-processes

Public Pi extension for managing background processes.

## Tool and command audience

The `process` tool is for **LLM use only**, not for users directly. Users can monitor processes via `/ps`, but they should never be the ones starting background processes — that is the agent's job.

During UI tests that require processes to be running, either give the user a prompt to send to the agent (which will start the processes via the `process` tool), or use tmux to drive it programmatically. Never instruct the user to run shell commands manually.

## Polling behavior

The `process` tool is event-driven. After `process start`, do not poll with repeated `process list`, `process output`, or `process logs` calls just to check whether a process is still running or has exited.

Instead, start the process once and rely on the automatic notification sent when the process exits, fails, or is externally killed. If the next step is waiting, call `process start` by itself; it ends the agent turn by default so the notification becomes the next step. Set `continueAfterStart=true` only when there is immediate, specific, non-polling work to do. Use `output`/`logs` only for explicit inspection, debugging, or a one-off diagnostic snapshot.

## Stack

- TypeScript (strict mode), pnpm 10.26.1, Biome

## Scripts

- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm format`

## Structure

- `src/index.ts` - entry, `src/manager.ts` - process manager, `src/config.ts` - config loader, `src/constants/` - types/constants, `src/commands/` - slash commands, `src/tools/` - tool actions, `src/hooks/` - event hooks, `src/components/` - TUI, `src/utils/` - helpers, `test/` - test scripts and QA docs
