/** Simple deterministic hash — not cryptographic, sufficient for audit dedup / rate keys. */
export function hashEmail(email: string): string {
  let h = 0;
  const s = email.trim().toLowerCase();
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return `e${Math.abs(h).toString(16)}`;
}
