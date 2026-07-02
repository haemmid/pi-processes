import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { ExecuteResult } from "../../constants";
import type { ProcessManager } from "../../manager";
import { formatTimestamp, sanitizeLine } from "../../utils";
import { buildNextCommands } from "./utils";

interface EnsureParams {
  name?: string;
  command?: string;
  cwd?: string;
}

export function executeEnsure(
  params: EnsureParams,
  manager: ProcessManager,
  ctx: ExtensionContext,
): ExecuteResult {
  if (!params.name) {
    return {
      content: [{ type: "text", text: "Missing required parameter: name" }],
      details: {
        action: "ensure",
        success: false,
        message: "Missing required parameter: name",
      },
    };
  }
  if (!params.command) {
    return {
      content: [{ type: "text", text: "Missing required parameter: command" }],
      details: {
        action: "ensure",
        success: false,
        message: "Missing required parameter: command",
      },
    };
  }

  const proc = manager.ensure(
    params.name,
    params.command,
    params.cwd ?? ctx.cwd,
  );

  if (proc === null) {
    return {
      content: [
        {
          type: "text",
          text: `A process named "${params.name}" is already running with a different command or cwd. Use process kill first, or process restart to replace it.`,
        },
      ],
      details: {
        action: "ensure",
        success: false,
        message: `A process named "${params.name}" is already running with a different configuration.`,
      },
    };
  }

  const startedAt = formatTimestamp(proc.startTime);

  // Check if this was an existing process or newly started
  const isNew = proc.pid > 0;
  const message = isNew
    ? [
        `Started "${sanitizeLine(proc.name)}" (${proc.id}, PID: ${proc.pid})`,
        `Started at: ${startedAt}`,
        `Logs: ${proc.stdoutFile}`,
        buildNextCommands(proc.name),
      ].join("\n")
    : [
        `Already running "${sanitizeLine(proc.name)}" (${proc.id}, PID: ${proc.pid})`,
        `Reusing existing managed process.`,
        buildNextCommands(proc.name),
      ].join("\n");

  return {
    content: [{ type: "text", text: message }],
    details: {
      action: "ensure",
      success: true,
      message,
      process: proc,
    },
  };
}
