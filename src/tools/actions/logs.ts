import type { ExecuteResult } from "../../constants";
import type { ProcessManager } from "../../manager";
import { sanitizeLine } from "../../utils";
import { resolveSelector } from "./utils";

interface LogsParams {
  id?: string;
  name?: string;
}

export function executeLogs(
  params: LogsParams,
  manager: ProcessManager,
): ExecuteResult {
  const error = resolveSelector(params, manager);
  if (error) {
    return { ...error, details: { ...error.details, action: "logs" } };
  }

  const query = params.id || params.name || "";
  const resolved = manager.resolve(query);
  if (!resolved.ok) {
    return {
      content: [{ type: "text", text: `Process not found: "${query}"` }],
      details: {
        action: "logs",
        success: false,
        message: `Process not found: "${query}"`,
      },
    };
  }

  const proc = resolved.info;
  const logFiles = manager.getLogFiles(proc.id);
  if (!logFiles) {
    const message = `Could not get log files for: ${proc.id}`;
    return {
      content: [{ type: "text", text: message }],
      details: {
        action: "logs",
        success: false,
        message,
      },
    };
  }

  const message = [
    `Log files for "${sanitizeLine(proc.name)}" (${proc.id}):`,
    `  stdout: ${logFiles.stdoutFile}`,
    `  stderr: ${logFiles.stderrFile}`,
    `  combined: ${logFiles.combinedFile}`,
    "",
    "Use the read tool to inspect these files.",
  ].join("\n");

  return {
    content: [{ type: "text", text: message }],
    details: {
      action: "logs",
      success: true,
      message,
      logFiles,
    },
  };
}
