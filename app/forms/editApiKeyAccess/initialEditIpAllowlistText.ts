/** Text for the IP allowlist textarea: saved IPs, or allow-all line when stored list is empty. */
export function initialEditIpAllowlistText(key: { ipAllowlist?: string[] }): string {
  const list = key.ipAllowlist ?? [];
  if (list.length > 0) return list.join("\n");
  return "0.0.0.0";
}
