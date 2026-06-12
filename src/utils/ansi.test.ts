import { describe, expect, it } from "vitest";
import { sanitizeLine, stripAnsi } from "./ansi";

const CONTROL_CHARS = /[\p{Cc}]/u;

describe("terminal output sanitizing", () => {
  it("strips common terminal escape sequences", () => {
    expect(stripAnsi("\u001b[?25lhidden\u001b[?25h")).toBe("hidden");
    expect(stripAnsi("\u001b]0;window title\u0007hello")).toBe("hello");
    expect(stripAnsi("\u001b]0;window title\u001b\\hello")).toBe("hello");
    expect(stripAnsi("\u001b_pi:c\u0007cursor")).toBe("cursor");
    expect(stripAnsi("\u001bPpayload\u001b\\done")).toBe("done");
  });

  it("sanitizes output for single-line TUI rendering", () => {
    const sanitized = sanitizeLine(
      "a\tb\r\n\u0007c\bd\u001b[31m red \u001b[0m\u001b[?25l",
    );

    expect(sanitized).toBe("a  bcd red ");
    expect(sanitized).not.toContain("\u001b");
    expect(sanitized).not.toMatch(CONTROL_CHARS);
  });
});
