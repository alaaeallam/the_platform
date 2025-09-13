// requests/upload.ts
import axios from "axios";

export async function uploadImages(formData: FormData): Promise<string[]> {
  const { data } = await axios.post("/api/cloudinary", formData, {
    headers: { "content-type": "multipart/form-data" },
  });

  // Normalize common shapes to string[]
  if (Array.isArray(data)) return data;
  if (data?.urls && Array.isArray(data.urls)) return data.urls;
  if (data?.data && Array.isArray(data.data)) return data.data;

  return [];
}