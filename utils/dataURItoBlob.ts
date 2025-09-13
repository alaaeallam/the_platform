/**
 * Convert a data URI (base64 or URL-encoded) into a Blob.
 *
 * @param dataURI - The data URI string (e.g., "data:image/png;base64,....").
 * @returns A Blob representing the binary data.
 */
export default function dataURItoBlob(dataURI: string): Blob {
  if (!dataURI.includes(",")) {
    throw new Error("Invalid dataURI format: missing comma separator");
  }

  const [header, data] = dataURI.split(",");

  // Decode base64 or URI-encoded string
  const byteString =
    header.indexOf("base64") >= 0 ? atob(data) : decodeURIComponent(data);

  // Extract MIME type (e.g., "image/png")
  const mimeMatch = header.match(/data:(.*?)(;base64)?$/);
  const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";

  // Convert string to binary array
  const ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], { type: mimeType });
}