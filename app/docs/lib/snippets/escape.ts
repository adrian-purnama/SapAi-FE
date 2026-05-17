/** Escape a string for use inside double quotes in bash/sh (curl -H "..."). */
export function bashDoubleQuoted(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/`/g, "\\`")}"`;
}

/** Escape JSON for use inside single quotes in POSIX shell (--data-raw '...'). */
export function bashSingleQuotedJson(json: string): string {
  return `'${json.replace(/'/g, `'\\''`)}'`;
}
