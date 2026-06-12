import { appendFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Theme } from "@earendil-works/pi-coding-agent";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LogFileViewer } from "./log-file-viewer";

interface InspectableLogFileViewer {
  cache: { lines: unknown[] };
}

const theme = {
  fg: (_color: string, text: string) => text,
} as unknown as Theme;

describe("LogFileViewer", () => {
  let dir: string;
  let filePath: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "pi-processes-log-viewer-"));
    filePath = join(dir, "combined.log");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("sanitizes rendered log lines", () => {
    writeFileSync(
      filePath,
      "1:ok\n2:\u001b[31mfailed\u001b[0m\u0007\n1:a\tb\rprogress\n",
    );

    const viewer = new LogFileViewer({ filePath, theme, follow: true });

    expect(viewer.renderLines(80, 10)).toEqual([
      "ok",
      "failed",
      "a  bprogress",
    ]);
  });

  it("reuses parsed lines when the file is unchanged and updates on append or truncation", () => {
    writeFileSync(filePath, "1:first\n2:second\n");
    const viewer = new LogFileViewer({ filePath, theme, follow: true });

    expect(viewer.renderLines(80, 10)).toEqual(["first", "second"]);
    const cachedLines = (viewer as unknown as InspectableLogFileViewer).cache
      .lines;

    viewer.renderStatusBar(20);
    expect((viewer as unknown as InspectableLogFileViewer).cache.lines).toBe(
      cachedLines,
    );

    appendFileSync(filePath, "1:third\n");
    expect(viewer.renderLines(80, 10)).toEqual(["first", "second", "third"]);

    writeFileSync(filePath, "1:reset\n");
    expect(viewer.renderLines(80, 10)).toEqual(["reset"]);
  });
});
