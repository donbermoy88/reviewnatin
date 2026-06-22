const DEFAULT_SPEECH_CHUNK_LIMIT = 3500;

export function resolveSpeechChunkLimit(nativeLimit?: number): number {
  const limit = Number(nativeLimit);
  if (!Number.isFinite(limit) || limit <= 0 || limit > DEFAULT_SPEECH_CHUNK_LIMIT * 2) {
    return DEFAULT_SPEECH_CHUNK_LIMIT;
  }
  return Math.max(1, Math.floor(limit * 0.9));
}

export function splitSpeechText(text: string, maxLength = DEFAULT_SPEECH_CHUNK_LIMIT): string[] {
  const limit = Math.max(1, Math.floor(maxLength));
  const chunks: string[] = [];
  let remaining = text.trim();

  while (remaining.length > limit) {
    const boundary = findChunkBoundary(remaining, limit);
    const chunk = remaining.slice(0, boundary).trim();

    if (chunk) chunks.push(chunk);
    remaining = remaining.slice(boundary).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

function findChunkBoundary(text: string, limit: number): number {
  const strongBoundary = Math.max(
    text.lastIndexOf('. ', limit),
    text.lastIndexOf('! ', limit),
    text.lastIndexOf('? ', limit)
  );
  if (strongBoundary >= Math.floor(limit * 0.4)) return strongBoundary + 1;

  const softBoundary = Math.max(text.lastIndexOf('; ', limit), text.lastIndexOf(', ', limit), text.lastIndexOf(' ', limit));
  if (softBoundary >= Math.floor(limit * 0.4)) return softBoundary + 1;

  return limit;
}
