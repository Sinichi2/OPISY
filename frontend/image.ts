/**
 * Shrinks a picked image to a JPEG blob capped at `max` px on the longest
 * side. Skips the resize (returns the file unchanged) if the browser lacks
 * OffscreenCanvas -- rare in modern mobile browsers, server still validates.
 */
export async function resizeToJpeg(file: File, max = 1280, quality = 0.85): Promise<Blob> {
  if (typeof OffscreenCanvas === "undefined" || typeof createImageBitmap === "undefined") {
    return file;
  }
  const bitmap = await createImageBitmap(file);
  const scale  = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = new OffscreenCanvas(w, h);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  return canvas.convertToBlob({ type: "image/jpeg", quality });
}
