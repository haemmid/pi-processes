import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { ExecuteResult } from "../../constants";
import type { ProcessManager } from "../../manager";
import { formatTimestamp, sanitizeLine } from "../../utils";
import { executeKill } from "./kill";
import { buildNextCommands } from "./utils";

interface RestartParams {
  name?: string;
  command?: string;
  cwd?: string;
  force?: boolean;
}

export async function executeRestart(
  params: RestartParams,
  manager: ProcessManager,
  ctx: ExtensionContext,
): Promise<ExecuteResult> {
  if (!params.name) {
    return {
      content: [{ type: "text", text: "Missing required parameter: name" }],
      details: {
        action: "restart",
        success: false,
        message: "Missing required parameter: name",
      },
    };
  }
  if (!params.command) {
    return {
      content: [{ type: "text", text: "Missing required parameter: command" }],
      details: {
        action: "restart",
        success: false,
        message: "Missing required parameter: command",
      },
    };
  }

  // Resolve existing process
  const existing = manager.resolve(params.name);
  if (!existing.ok) {
    return {
      content: [
        {
          type: "text",
          text: `No process named "${params.name}" is running. Use process start instead.`,
        },
      ],
      details: {
        action: "restart",
        success: false,
        message: `No process named "${params.name}" is running.`,
      },
    };
  }

  // Kill existing process (awaited, safe)
  const killResult = await executeKill(
    { id: existing.info.id, force: params.force },
    manager,
  );
  if (!killResult.details.success) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to kill existing process: ${killResult.details.message}`,
        },
      ],
      details: {
        action: "restart",
        success: false,
        message: `Failed to kill existing process: ${killResult.details.message}`,
      },
    };
  }

  // Start new process
  const proc = manager.start(
    params.name,
    params.command,
    params.cwd ?? ctx.cwd,
  );

  if (proc === null) {
    return {
      content: [
        {
          type: "text",
          text: `A process named "${params.name}" is already running. Use process kill first.`,
        },
      ],
      details: {
        action: "restart",
        success: false,
        message: `A process named "${params.name}" is already running.`,
      },
    };
  }

  const startedAt = formatTimestamp(proc.startTime);
  const message = [
    `Restarted "${sanitizeLine(proc.name)}" (${proc.id}, PID: ${proc.pid})`,
    `Started at: ${startedAt}`,
    `Logs: ${proc.stdoutFile}`,
    buildNextCommands(proc.name),
  ].join("\n");
  return {
    content: [{ type: "text", text: message }],
    details: {
      action: "restart",
      success: true,
      message,
      process: proc,
    },
  };
}
