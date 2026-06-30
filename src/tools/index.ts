import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { ProcessesDetails } from "../constants";
import type { ProcessManager } from "../manager";
import { executeAction } from "./actions";

const ProcessesParams = Type.Object({
  action: Type.Union(
    [
      Type.Literal("start"),
      Type.Literal("list"),
      Type.Literal("output"),
      Type.Literal("logs"),
      Type.Literal("kill"),
      Type.Literal("clear"),
    ],
    {
      description:
        "Action: start (run command), list (show all), output (get recent output), logs (get log file paths), kill (terminate or force-kill), clear (remove finished)",
    },
  ),
  command: Type.Optional(
    Type.String({ description: "Command to run (required for start)" }),
  ),
  name: Type.Optional(
    Type.String({
      description:
        "Friendly name for the process (required for start, e.g. 'backend-dev', 'test-runner')",
    }),
  ),
  id: Type.Optional(
    Type.String({
      description:
        "Exact process ID or exact friendly name to match (required for output/kill/logs).",
    }),
  ),
  force: Type.Optional(
    Type.Boolean({
      description:
        "Force-kill the process with SIGKILL for kill action. Use after a normal terminate times out, or when you need an immediate hard stop.",
    }),
  ),
  continueAfterStart: Type.Optional(
    Type.Boolean({
      description:
        "For start only. Leave unset/false when the next step is to wait for process completion; process start will end this agent turn and the extension will resume you on exit. Set true only when there is immediate, specific, non-polling work to do when there is immediate, specific, non-polling work to do after starting.",
    }),
  ),
});

export function setupProcessesTools(pi: ExtensionAPI, manager: ProcessManager) {
  pi.registerTool<typeof ProcessesParams, ProcessesDetails>({
    name: "process",
    label: "Process",
    description: `Manage background processes.

Actions: start, list, output, logs, kill, clear.
- start requires 'name' and 'command'
- output/logs/kill require 'id' (exact process ID or exact friendly name)
- kill supports optional 'force=true' for SIGKILL
- start supports optional 'continueAfterStart=true' only when there is immediate non-polling work to do

Important behavior:
- By default, 'start' ends the current agent turn. If the next step is waiting, call 'start' by itself and wait for the automatic process-end notification instead of calling 'list', 'output', or 'logs' repeatedly.
- Set 'continueAfterStart=true' only when there is specific useful work to do immediately after starting the process; do not poll.
- This tool is event-driven: the agent is notified automatically when a process exits, fails, or is externally killed.
- Tool-triggered kills never notify.
- Use 'output' or 'logs' only on demand: when the user asks, when you need a one-off diagnostic snapshot, or when investigating a problem.

Preferred pattern: start the process once, let the turn stop, and resume from the automatic notification instead of polling.`,
    promptSnippet:
      "Start and manage background processes without blocking the conversation; process start waits for notifications by default",
    promptGuidelines: [
      "Use the process tool instead of bash for dev servers, watch mode, log tails, port-forwards, or commands that should keep running.",
      "After process start, do not call process list/output/logs just to wait. If the next step is waiting, call process start by itself; by default it ends the turn and the extension will resume the agent when the process exits.",
      "Set process continueAfterStart=true only when there is immediate, specific, non-polling work to do after start.",
      "Use process output or process logs only for a one-off inspection, explicit user request, or debugging.",
    ],

    parameters: ProcessesParams,

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      return executeAction(params, manager, ctx);
    },
  });
}
