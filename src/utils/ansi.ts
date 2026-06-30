/**
 * Strip ANSI escape codes and other terminal control characters from a string.
 *
 * Removes:
 * - All CSI sequences (\x1b[...X) - SGR, cursor movement, erase, scroll, etc.
 * - OSC sequences (\x1b]...\x07 or \x1b]...\x1b\\)
 * - APC sequences (\x1b_...\x07 or \x1b_...\x1b\\)
 * - Remaining C0 control chars except tab/newline
 */

const ESC = String.fromCodePoint(0x001b);
const BEL = String.fromCodePoint(0x0007);

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
  let clean = str;

  if (str.includes(ESC)) {
    // Strip all CSI sequences (ESC[...X where X is any letter)
    clean = clean.replace(new RegExp(`${ESC}\\[[0-9;]*[A-Za-z]`, "gu"), "");
    // Strip OSC sequences: ESC]...<BEL> or ESC]...<ESC>\\
    clean = clean.replace(
      new RegExp(`${ESC}\\][^${BEL}${ESC}]*(?:${BEL}|${ESC}\\\\)`, "gu"),
      "",
    );
    // Strip APC sequences: ESC_...<BEL> or ESC_...<ESC>\\ (used for cursor marker)
    clean = clean.replace(
      new RegExp(`${ESC}_[^${BEL}${ESC}]*(?:${BEL}|${ESC}\\\\)`, "gu"),
      "",
    );
  }

  // Strip terminal control chars like carriage return/backspace that can
  // corrupt TUI layout when rendered back into pi.
  return Array.from(clean)
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      const isDisallowedC0 =
        (code >= 0x00 && code <= 0x08) ||
        (code >= 0x0b && code <= 0x1f) ||
        code === 0x7f;
      return !isDisallowedC0;
    })
    .join("");
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
  return stripAnsi(str).replace(/\t/g, "  ");
}
