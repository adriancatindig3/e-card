const ACCEPTED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function uploadImage(file: File): Promise<string> {
  if (!ACCEPTED.has(file.type)) {
    throw new Error('Use a JPEG, PNG, WebP, or GIF image.');
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Image must be 8 MB or smaller.');
  }

  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', preset);

  let response: Response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
      method: 'POST',
      body,
    });
  } catch {
    throw new Error('Upload failed. Check the connection and try again.');
  }

  const payload = (await response.json().catch(() => null)) as {
    secure_url?: unknown;
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Upload failed.');
  }

  const url = payload?.secure_url;
  if (typeof url !== 'string' || !url.startsWith('https://')) {
    throw new Error('Upload did not return a secure image URL.');
  }
  return url;
}
