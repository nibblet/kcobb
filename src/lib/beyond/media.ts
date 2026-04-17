export const MEDIA_BUCKET = "beyond-media";

export const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export const MAX_BYTES = 15 * 1024 * 1024;

export function extFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    default:
      return "bin";
  }
}

/**
 * Build the public URL for an object in the beyond-media bucket. Accepts an
 * optional transform width for Supabase's image resizing.
 */
export function mediaUrl(
  baseUrl: string,
  storagePath: string,
  opts?: { width?: number }
): string {
  const width = opts?.width;
  if (width) {
    // Supabase transform endpoint — requires pro tier or self-hosted; falls
    // back to original URL if transforms aren't available (the client just
    // gets the full image).
    return `${baseUrl}/storage/v1/render/image/public/${MEDIA_BUCKET}/${storagePath}?width=${width}&resize=contain`;
  }
  return `${baseUrl}/storage/v1/object/public/${MEDIA_BUCKET}/${storagePath}`;
}
