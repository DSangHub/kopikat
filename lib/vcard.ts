function escapeVcard(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildVcard(input: { name: string; phone?: string; email?: string; company?: string; title?: string; url?: string }) {
  const parts = input.name.trim().split(/\s+/);
  const given = parts[0] || input.name;
  const family = parts.slice(1).join(" ");
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVcard(input.name)}`,
    `N:${escapeVcard(family)};${escapeVcard(given)};;;`,
  ];
  if (input.company) lines.push(`ORG:${escapeVcard(input.company)}`);
  if (input.title) lines.push(`TITLE:${escapeVcard(input.title)}`);
  if (input.phone) lines.push(`TEL;TYPE=CELL:${escapeVcard(input.phone)}`);
  if (input.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVcard(input.email)}`);
  if (input.url) lines.push(`URL:${escapeVcard(input.url)}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}
