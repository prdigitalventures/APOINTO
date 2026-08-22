export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

export async function readMediaFile(file: File): Promise<{ kind: 'PHOTO' | 'VIDEO'; data: string }> {
  if (file.type.startsWith('video/')) {
    if (file.size > 900_000) throw new Error('Use a short video under about 1 MB.');
    const data = await readFileAsDataUrl(file);
    return { kind: 'VIDEO', data };
  }
  if (!file.type.startsWith('image/')) throw new Error('Choose a photo or a short video.');
  const { compressImage } = await import('@/components/profile/compressImage');
  return { kind: 'PHOTO', data: await compressImage(file, 720) };
}
