export type SegmentKind = "flag" | "value" | "cont" | "plain";

export interface Segment {
  text: string;
  kind: SegmentKind;
}

// A flag: one or two leading dashes then a letter, then word chars / dashes.
const FLAG = /^--?[A-Za-z][\w-]*$/;
// A value: a pure number (incl. decimals), OR ANY token containing ':' anywhere
// (the ':' branch is intentionally unanchored — catches image:tag, host:port, URIs).
const VALUE = /^[\d.]+$|:/;

/**
 * Tokenize a shell command into classified segments for syntax highlighting.
 * Splits on whitespace runs but KEEPS them (as `plain`) so joining all segment
 * `text` reproduces the input exactly. Pure + deterministic (no Date/random).
 */
export function highlight(command: string): Segment[] {
  return command
    .split(/(\s+)/)
    .filter((t) => t.length > 0)
    .map((tok): Segment => {
      if (/^\s+$/.test(tok)) return { text: tok, kind: "plain" };
      if (tok === "\\") return { text: tok, kind: "cont" };
      if (FLAG.test(tok)) return { text: tok, kind: "flag" };
      if (VALUE.test(tok)) return { text: tok, kind: "value" };
      return { text: tok, kind: "plain" };
    });
}
