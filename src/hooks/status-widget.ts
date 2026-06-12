import type {
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { truncateToWidth } from "@earendil-works/pi-tui";
import type { ProcessInfo } from "../constants";
import type { ProcessManager } from "../manager";

const STATUS_WIDGET_ID = "processes-status";

function renderStatusWidgetLine(
  processes: ProcessInfo[],
  theme: ExtensionContext["ui"]["theme"],
): string | null {
  if (processes.length === 0) return null;

  const activeCount = processes.filter(
    (process) =>
      process.status === "running" ||
      process.status === "terminating" ||
      process.status === "terminate_timeout",
  ).length;
  const finishedCount = processes.length - activeCount;

  const line =
    theme.fg("dim", "processes: ") +
    theme.fg("accent", String(activeCount)) +
    theme.fg("dim", " active") +
    theme.fg("dim", " | ") +
    theme.fg("dim", String(finishedCount)) +
    theme.fg("dim", " finished");

  return line;
}

export function setupStatusWidget(
  pi: ExtensionAPI,
  manager: ProcessManager,
): void {
  let latestContext: ExtensionContext | null = null;

  const updateWidget = (): void => {
    if (!latestContext?.hasUI) return;

    const processes = manager.list();
    if (processes.length === 0) {
      latestContext.ui.setWidget(STATUS_WIDGET_ID, undefined);
      return;
    }

    latestContext.ui.setWidget(
      STATUS_WIDGET_ID,
      (_tui, theme) => ({
        render(width: number): string[] {
          const line = renderStatusWidgetLine(processes, theme);
          if (!line) return [];
          return [truncateToWidth(line, width, "", true)];
        },
        invalidate(): void {},
      }),
      { placement: "belowEditor" },
    );
  };

  manager.onEvent(() => {
    updateWidget();
  });

  pi.on("session_start", async (_event, ctx) => {
    latestContext = ctx;
    updateWidget();
  });
}
