import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { ExecuteResult } from "../../constants";
import type { ProcessManager } from "../../manager";
import { formatTimestamp, sanitizeLine } from "../../utils";

interface StartParams {
  name?: string;
  command?: string;
  restart?: boolean;
}

export function executeStart(
  params: StartParams,
  manager: ProcessManager,
  ctx: ExtensionContext,
): ExecuteResult {
  if (!params.name) {
    return {
      content: [{ type: "text", text: "Missing required parameter: name" }],
      details: {
        action: "start",
        success: false,
        message: "Missing required parameter: name",
      },
    };
  }
  if (!params.command) {
    return {
      content: [{ type: "text", text: "Missing required parameter: command" }],
      details: {
        action: "start",
        success: false,
        message: "Missing required parameter: command",
      },
    };
  }

  try {
    const proc = manager.start(
      params.name,
      params.command,
      ctx.cwd,
      params.restart ? { restart: true } : undefined,
    );

    if (proc === null) {
      return {
        content: [
          {
            type: "text",
            text: `A process named "${params.name}" is already running. Use process kill first, or restart=true to replace it.`,
          },
        ],
        details: {
          action: "start",
          success: false,
          message: `A process named "${params.name}" is already running.`,
        },
      };
    }

    const startedAt = formatTimestamp(proc.startTime);
    const message = `Started "${sanitizeLine(proc.name)}" (${proc.id}, PID: ${proc.pid})\nStarted at: ${startedAt}\nLogs: ${proc.stdoutFile}`;
    return {
      content: [{ type: "text", text: message }],
      details: {
        action: "start",
        success: true,
        message,
        process: proc,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? `Failed to start process: ${error.message}`
        : "Failed to start process";

    return {
      content: [{ type: "text", text: message }],
      details: {
        action: "start",
        success: false,
        message,
      },
    };
  }
}
