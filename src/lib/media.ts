export const MAX_PHOTO_CHARS = 350_000;
export const MAX_VIDEO_CHARS = 1_200_000;

export type MediaKind = 'PHOTO' | 'VIDEO';

export function parseMediaPayload(raw: unknown): { kind: MediaKind; data: string; caption: string | null } | { error: string } {
  if (!raw || typeof raw !== 'object') return { error: 'Upload a file.' };
  const body = raw as Record<string, unknown>;
  const data = typeof body.data === 'string' ? body.data : '';
  const caption =
    typeof body.caption === 'string' ? body.caption.trim().slice(0, 120) || null : null;
  const kindRaw = typeof body.kind === 'string' ? body.kind.toUpperCase() : '';

  if (data.startsWith('data:image/')) {
    if (data.length > MAX_PHOTO_CHARS) return { error: 'Photo is too large. Try a smaller image.' };
    return { kind: 'PHOTO', data, caption };
  }
  if (data.startsWith('data:video/')) {
    if (data.length > MAX_VIDEO_CHARS) return { error: 'Video is too large. Use a short clip under about 1 MB.' };
    if (kindRaw && kindRaw !== 'VIDEO') return { error: 'Upload a video file.' };
    return { kind: 'VIDEO', data, caption };
  }
  return { error: 'Upload a photo or a short video.' };
}

export function publicMedia(row: { id: string; kind: string; data: string; caption: string | null; createdAt: Date }) {
  return {
    id: row.id,
    kind: row.kind,
    data: row.data,
    caption: row.caption,
    createdAt: row.createdAt.toISOString(),
  };
}
