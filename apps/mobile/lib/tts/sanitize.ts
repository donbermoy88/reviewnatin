export function sanitizeSpeechText(text: string): string {
  return text
    .replace(/\|[-:\s|]+\|/g, ' ')
    .replace(/[|*_`#>]/g, ' ')
    .replace(/^[-*]\s+/gm, ' ')
    .replace(/^\d+\.\s+/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
