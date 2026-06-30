import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { ResolvedProcessesConfig } from "../config";
import type { ProcessManager } from "../manager";
import { setupBackgroundBlocker } from "./background-blocker";
import { setupCleanupHook } from "./cleanup";
import { setupProcessEndHook } from "./process-end";

export function setupProcessesHooks(
  pi: ExtensionAPI,
  manager: ProcessManager,
  config: ResolvedProcessesConfig,
): void {
  setupCleanupHook(pi, manager);
  setupProcessEndHook(pi, manager);

  if (config.interception.blockBackgroundCommands) {
    setupBackgroundBlocker(pi);
  }
}
