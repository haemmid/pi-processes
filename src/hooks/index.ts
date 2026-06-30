import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import type { ResolvedProcessesConfig } from "../config";
import type { ProcessManager } from "../manager";
import { setupBackgroundBlocker } from "./background-blocker";
import { setupCleanupHook } from "./cleanup";

export function setupProcessesHooks(
  pi: ExtensionAPI,
  manager: ProcessManager,
  config: ResolvedProcessesConfig,
): void {
  setupCleanupHook(pi, manager);

  if (config.interception.blockBackgroundCommands) {
    setupBackgroundBlocker(pi);
  }
}
