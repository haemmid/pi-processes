import type { ExecuteResult } from "../../constants";
import type { ProcessManager } from "../../manager";
import { sanitizeLine } from "../../utils";
import { resolveSelector } from "./utils";

interface KillParams {
  id?: string;
  name?: string;
  force?: boolean;
}

export async function executeKill(
  params: KillParams,
  manager: ProcessManager,
): Promise<ExecuteResult> {
  const error = resolveSelector(params, manager);
  if (error) {
    return { ...error, details: { ...error.details, action: "kill" } };
  }

  const query = params.id || params.name || "";
  const resolved = manager.resolve(query);
  if (!resolved.ok) {
    return {
      content: [{ type: "text", text: `Process not found: "${query}"` }],
      details: {
        action: "kill",
        success: false,
        message: `Process not found: "${query}"`,
      },
    };
  }

  const proc = resolved.info;
  const force = params.force ?? false;
  const signal = force ? "SIGKILL" : "SIGTERM";
  const timeoutMs = force ? 200 : 3000;
  const result = await manager.kill(proc.id, { signal, timeoutMs });

  if (result.ok) {
    const verb = force ? "Force-killed" : "Terminated";
    const message = `${verb} "${sanitizeLine(proc.name)}" (${proc.id})`;
    return {
      content: [{ type: "text", text: message }],
      details: {
        action: "kill",
        success: true,
        message,
      },
    };
  }

  if (result.reason === "timeout") {
    const message = force
      ? `SIGKILL timed out for "${sanitizeLine(proc.name)}" (${proc.id})`
      : `SIGTERM timed out for "${sanitizeLine(proc.name)}" (${proc.id}). Re-run process kill with id="${proc.id}" force=true to send SIGKILL.`;
    return {
      content: [{ type: "text", text: message }],
      details: {
        action: "kill",
        success: false,
        message,
      },
    };
  }

  const message = force
    ? `Failed to force-kill "${sanitizeLine(proc.name)}" (${proc.id})`
    : `Failed to terminate "${sanitizeLine(proc.name)}" (${proc.id})`;
  return {
    content: [{ type: "text", text: message }],
    details: {
      action: "kill",
      success: false,
      message,
    },
  };
}
