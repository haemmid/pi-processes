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
      Type.Literal("restart"),
    ],
    {
      description:
        "Action: start (run command), list (show all), output (get recent output), logs (get log file paths), kill (terminate or force-kill), clear (remove finished), restart (kill existing and start new)",
    },
  ),
  command: Type.Optional(
    Type.String({ description: "Command to run (required for start/restart)" }),
  ),
  name: Type.Optional(
    Type.String({
      description:
        "Friendly name for the process (required for start/restart, e.g. 'backend-dev', 'test-runner')",
    }),
  ),
  cwd: Type.Optional(
    Type.String({
      description:
        "Working directory for the command (for start/restart action). Defaults to the session working directory. Prefer this over 'cd dir && command' shell wrappers.",
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
});

export function setupProcessesTools(pi: ExtensionAPI, manager: ProcessManager) {
  pi.registerTool<typeof ProcessesParams, ProcessesDetails>({
    name: "process",
    label: "Process",
    description: `Manage background processes.

Actions: start, list, output, logs, kill, clear, restart.
- start/restart require 'name' and 'command' — restart kills existing process first
- output/logs/kill require 'id' (exact process ID or exact friendly name)
- kill supports optional 'force=true' for SIGKILL
- restart is preferred over start+kill: it safely awaits kill before starting new process

Processes continue in the background. Use process output or process logs for a one-off snapshot when you need to inspect status. Do not poll repeatedly just to wait.
Tool-triggered kills never notify.`,
    promptSnippet:
      "Start and manage background processes without blocking the conversation; process start waits for notifications by default",
    promptGuidelines: [
      "Use the process tool instead of bash for dev servers, watch mode, log tails, port-forwards, or commands that should keep running.",
      "After process start, the agent continues its turn — use process output/logs to check status if needed.",
      "Use process output or process logs only for a one-off inspection, explicit user request, or debugging.",
      "Use process restart to replace an existing process — it safely awaits kill before starting the new one.",
      "Do not poll process output/list repeatedly just to wait for a process to finish.",
    ],

    parameters: ProcessesParams,

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      return executeAction(params, manager, ctx);
    },
  });
}
