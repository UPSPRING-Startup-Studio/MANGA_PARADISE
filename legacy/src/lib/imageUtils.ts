/**
 * Supabase Storage image transformation helper.
 *
 * Appends `?width=W&height=H&resize=cover&quality=Q` to any Supabase Storage
 * public URL so the CDN returns a resized version instead of the original
 * (which can be 2-4 MB per photo).
 *
 * Non-Supabase URLs are returned untouched.
 */

const SUPABASE_STORAGE_HOST = "supabase.co/storage/v1/object/public/";

export function thumbnailUrl(
  url: string,
  width: number,
  height?: number,
  quality = 75,
): string {
  if (!url || !url.includes(SUPABASE_STORAGE_HOST)) return url;

  // Strip any existing transform params
  const base = url.split("?")[0];
  const params = new URLSearchParams({
    width: String(width),
    ...(height ? { height: String(height) } : {}),
    resize: "cover",
    quality: String(quality),
  });

  return `${base}?${params.toString()}`;
}
