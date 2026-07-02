import type { ExecuteResult } from "../../constants";
import type { ProcessManager } from "../../manager";
import { sanitizeLine } from "../../utils";

interface SelectorParams {
  id?: string;
  name?: string;
}

export interface ResolvedProcess {
  id: string;
  name: string;
}

export function resolveSelector(
  params: SelectorParams,
  manager: ProcessManager,
): ExecuteResult | null {
  // Missing selector
  if (!params.id && !params.name) {
    return {
      content: [
        {
          type: "text",
          text: 'Missing process selector. Use either id="proc_1" or name="backend-dev".',
        },
      ],
      details: {
        action: "output",
        success: false,
        message: "Missing process selector. Use either id or name.",
      },
    };
  }

  // Both specified
  if (params.id && params.name) {
    return {
      content: [
        {
          type: "text",
          text: "Use either id or name, not both.",
        },
      ],
      details: {
        action: "output",
        success: false,
        message: "Use either id or name, not both.",
      },
    };
  }

  // Resolve by id or name
  const query = params.id || params.name || "";
  const resolved = manager.resolve(query);

  if (resolved.ok) {
    return null; // resolved successfully
  }

  if (resolved.reason === "ambiguous") {
    const choices = (resolved.matches ?? [])
      .map((match) => `${match.id} ("${sanitizeLine(match.name)}")`)
      .join(", ");
    return {
      content: [
        {
          type: "text",
          text: `Process name is ambiguous: "${query}". Use an exact process ID instead. Matches: ${choices}`,
        },
      ],
      details: {
        action: "output",
        success: false,
        message: `Process name is ambiguous: "${query}". Matches: ${choices}`,
      },
    };
  }

  return {
    content: [
      {
        type: "text",
        text: `Process not found: "${query}"`,
      },
    ],
    details: {
      action: "output",
      success: false,
      message: `Process not found: "${query}"`,
    },
  };
}

export function buildNextCommands(name: string): string {
  return [
    "",
    "Next commands:",
    `  process output name="${name}"`,
    `  process logs name="${name}"`,
    `  process restart "<command>" name="${name}"`,
    `  process kill name="${name}"`,
  ].join("\n");
}
