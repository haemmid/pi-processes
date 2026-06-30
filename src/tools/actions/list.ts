import { type ExecuteResult, LIVE_STATUSES } from "../../constants";
import type { ProcessManager } from "../../manager";
import {
  formatRuntime,
  formatStatus,
  sanitizeLine,
  truncateCmd,
} from "../../utils";

export function executeList(manager: ProcessManager): ExecuteResult {
  const processes = manager.list();

  if (processes.length === 0) {
    return {
      content: [{ type: "text", text: "No background processes running" }],
      details: {
        action: "list",
        success: true,
        message: "No background processes running",
        processes: [],
      },
    };
  }

  const summary = processes
    .map(
      (p) =>
        `${p.id} "${sanitizeLine(p.name)}": ${truncateCmd(sanitizeLine(p.command))} [${formatStatus(p)}] ${formatRuntime(p.startTime, p.endTime)}`,
    )
    .join("\n");

  const hasLiveProcess = processes.some((process) =>
    LIVE_STATUSES.has(process.status),
  );
  const waitNotice = hasLiveProcess
    ? "\n\nUse process output/logs only when you need a one-off status snapshot. Do not poll repeatedly just to wait."
    : "";
  const message = `${processes.length} process(es):\n${summary}${waitNotice}`;
  return {
    content: [{ type: "text", text: message }],
    details: {
      action: "list",
      success: true,
      message,
      processes,
    },
  };
}
