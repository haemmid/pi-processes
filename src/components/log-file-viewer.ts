/**
 * LogFileViewer reads the manager's combined log file and renders a scrollable
 * window of lines for the `/ps` overlay.
 */

import { closeSync, openSync, readSync, statSync } from "node:fs";
import type { Theme } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { sanitizeLine } from "../utils";

interface ParsedLine {
  type: "stdout" | "stderr";
  text: string;
}

interface LineCache {
  size: number;
  lines: ParsedLine[];
  pending: string;
}

interface LogFileViewerOptions {
  filePath: string;
  theme: Theme;
  /** Start in follow mode (auto-scroll to tail). Default: false */
  follow?: boolean;
}

const MAX_RETAINED_LOG_LINES = 10_000;

export class LogFileViewer {
  private filePath: string;
  private theme: Theme;

  private follow: boolean;
  private cache: LineCache = { size: 0, lines: [], pending: "" };
  /** Absolute index of the last visible line (1-based).
   *  null = follow mode; always shows latest lines. */
  private anchorEnd: number | null = null;

  constructor(opts: LogFileViewerOptions) {
    this.filePath = opts.filePath;
    this.theme = opts.theme;
    this.follow = opts.follow ?? false;
  }

  private readAllLines(): ParsedLine[] {
    let size: number;
    try {
      size = statSync(this.filePath).size;
    } catch {
      this.resetCache();
      return [];
    }

    if (size === this.cache.size) {
      return this.cache.lines;
    }

    if (size < this.cache.size) {
      this.resetCache();
    }

    if (size === 0) {
      this.resetCache();
      return [];
    }

    try {
      const chunk = this.readRange(this.cache.size, size - this.cache.size);
      this.cache.size = size;
      this.appendChunk(chunk);
      return this.cache.lines;
    } catch {
      return this.cache.lines;
    }
  }

  private resetCache(): void {
    this.cache = { size: 0, lines: [], pending: "" };
  }

  private readRange(start: number, length: number): string {
    if (length <= 0) return "";

    const fd = openSync(this.filePath, "r");
    try {
      const buffer = Buffer.allocUnsafe(length);
      const bytesRead = readSync(fd, buffer, 0, length, start);
      return buffer.subarray(0, bytesRead).toString("utf-8");
    } finally {
      closeSync(fd);
    }
  }

  private appendChunk(chunk: string): void {
    if (!chunk) return;

    const rawLines = `${this.cache.pending}${chunk}`.split("\n");
    this.cache.pending = rawLines.pop() ?? "";

    for (const line of rawLines) {
      this.cache.lines.push(this.parseLine(line));
    }

    if (this.cache.lines.length > MAX_RETAINED_LOG_LINES) {
      this.cache.lines.splice(
        0,
        this.cache.lines.length - MAX_RETAINED_LOG_LINES,
      );
    }
  }

  private parseLine(line: string): ParsedLine {
    // Combined format: "1:text" = stdout, "2:text" = stderr
    if (line.startsWith("2:")) {
      return { type: "stderr", text: line.slice(2) };
    }
    return {
      type: "stdout",
      text: line.startsWith("1:") ? line.slice(2) : line,
    };
  }

  scrollToTop(): void {
    this.anchorEnd = 0;
    this.follow = false;
  }

  /** delta > 0 = scroll toward older content, delta < 0 = toward newer. */
  scrollBy(delta: number): void {
    if (this.anchorEnd === null) {
      this.anchorEnd = this.readAllLines().length;
    }
    this.anchorEnd = Math.max(0, this.anchorEnd - delta);
    this.follow = false;
  }

  toggleFollow(): boolean {
    this.follow = !this.follow;
    this.anchorEnd = this.follow ? null : this.readAllLines().length;
    return this.follow;
  }

  isFollowing(): boolean {
    return this.follow;
  }

  /** Returns up to `maxLines` rendered content lines. */
  renderLines(width: number, maxLines: number): string[] {
    const dim = (s: string) => this.theme.fg("dim", s);
    const warning = (s: string) => this.theme.fg("warning", s);

    const lines = this.readAllLines();
    const total = lines.length;
    if (total === 0) return [dim("(no output yet)")];

    // Resolve anchor: null = follow (tail), number = absolute frozen end.
    const rawEnd = this.anchorEnd ?? total;
    // Clamp to valid range. Math.max with min(maxLines, total) ensures anchorEnd = 0
    // (scrollToTop sentinel) still shows a full window from the top.
    const endIdx = Math.min(total, Math.max(rawEnd, Math.min(maxLines, total)));
    const startIdx = Math.max(0, endIdx - maxLines);

    return lines.slice(startIdx, endIdx).map((line) => {
      const text = truncateToWidth(sanitizeLine(line.text), width);
      return line.type === "stderr" ? warning(text) : text;
    });
  }

  /** Returns a single status-bar string exactly `width` characters wide. */
  renderStatusBar(width: number): string {
    const dim = (s: string) => this.theme.fg("dim", s);
    const accent = (s: string) => this.theme.fg("accent", s);

    const total = this.readAllLines().length;
    let status: string;

    if (this.follow) {
      status = accent("following");
    } else if (total === 0) {
      status = dim("empty");
    } else {
      const rawEnd = this.anchorEnd ?? total;
      const endIdx = Math.min(total, Math.max(0, rawEnd));
      const pct = Math.round((endIdx / total) * 100);
      status = dim(`${pct}%  L${Math.min(endIdx, total)}/${total}`);
    }

    const safe = truncateToWidth(status, width);
    return safe + " ".repeat(Math.max(0, width - visibleWidth(safe)));
  }
}
