/** ESC byte used by terminal control sequences. */
const ESC = "\u001b";

/**
 * Broad terminal escape matcher.
 *
 * Covers:
 * - CSI, including private modes such as ESC[?25l
 * - OSC terminated by BEL or ST
 * - DCS/SOS/PM/APC terminated by BEL or ST
 * - single-character Fe escapes such as RIS (ESCc)
 */
const ANSI_PATTERN = new RegExp(
  [
    "\\x1B\\[[0-?]*[ -/]*[@-~]",
    "\\x1B\\][^\\x07\\x1B]*(?:\\x07|\\x1B\\\\)",
    "\\x1B[PX^_][^\\x07\\x1B]*(?:\\x07|\\x1B\\\\)",
    "\\x1B[@-_]",
  ].join("|"),
  "gu",
);

const CONTROL_CHARS_PATTERN = /[\p{Cc}]/gu;

/**
 * Check if a string contains terminal escape codes.
 */
export function hasAnsi(str: string): boolean {
  return str.includes(ESC);
}

/**
 * Strip terminal escape sequences from a string while preserving normal text,
 * whitespace, and line breaks.
 */
export function stripAnsi(str: string): string {
  if (!str.includes(ESC)) {
    return str;
  }

  return str.replace(ANSI_PATTERN, "");
}

/**
 * Sanitize process output for single-line TUI rendering.
 *
 * This is stricter than stripAnsi(): after terminal escapes are removed, any
 * remaining control bytes (carriage returns, backspaces, BEL, embedded
 * newlines, etc.) are dropped so process output cannot move the cursor or
 * alter Pi's surrounding TUI.
 */
export function sanitizeLine(str: string): string {
  return stripAnsi(str).replace(/\t/g, "  ").replace(CONTROL_CHARS_PATTERN, "");
}
