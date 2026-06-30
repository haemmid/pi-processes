import { describe, expect, it } from "vitest";
import { hasAnsi, sanitizeLine, stripAnsi } from "./ansi";

describe("stripAnsi", () => {
  it("strips CSI styling sequences", () => {
    expect(stripAnsi("\u001b[31mred\u001b[0m")).toBe("red");
  });

  it("strips generic OSC sequences", () => {
    expect(stripAnsi("\u001b]0;title\u0007hello")).toBe("hello");
  });

  it("strips carriage returns and other control chars that can corrupt TUI rendering", () => {
    const output = stripAnsi("step 1\rstep 2\b\b done");
    expect(output).toBe("step 1step 2 done");
    for (const char of output) {
      const code = char.codePointAt(0) ?? 0;
      const isDisallowedC0 =
        (code >= 0x00 && code <= 0x08) ||
        (code >= 0x0b && code <= 0x1f) ||
        code === 0x7f;
      expect(isDisallowedC0).toBe(false);
    }
  });
});

describe("sanitizeLine", () => {
  it("converts tabs to spaces and strips remaining control chars", () => {
    const sanitized = sanitizeLine("a\tb\r\nc\bd\u001b[31m red \u001b[0m");
    expect(sanitized).toBe("a  b\ncd red ");
    expect(sanitized).not.toContain("\u001b");
  });
});

describe("hasAnsi", () => {
  it("detects escape sequences", () => {
    expect(hasAnsi("\u001b[31mred\u001b[0m")).toBe(true);
    expect(hasAnsi("plain text")).toBe(false);
  });
});
