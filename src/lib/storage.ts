import { supabase, isSupabaseConfigured } from "./supabase";

export interface UploadAssetResult {
  url: string;
  path: string;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
  "image/avif",
]);

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB limit for architectural presentation renders

/**
 * Uploads an image asset to Supabase Storage 'presentation-assets' bucket,
 * or creates a local Object URL in guest mode.
 */
export async function uploadPresentationAsset(
  file: File,
  projectId: string
): Promise<UploadAssetResult> {
  // 1. Validate MIME type
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(
      `Unsupported file type (${file.type || "unknown"}). Supported: JPG, PNG, WebP, SVG, GIF, AVIF.`
    );
  }

  // 2. Validate file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`File size (${sizeMb} MB) exceeds maximum allowed limit of 15 MB.`);
  }

  // 3. Cloud Mode Upload (if Supabase configured & user is authenticated)
  if (isSupabaseConfigured && supabase) {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user) {
      const userId = authData.user.id;
      const cleanFileName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "_");
      const uniqueName = `${Date.now()}_${cleanFileName}`;
      const storagePath = `${userId}/${projectId}/${uniqueName}`;

      const { error: uploadError } = await supabase.storage
        .from("presentation-assets")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        console.error("[Storage] Supabase upload failed:", uploadError);
        throw new Error(`Cloud upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("presentation-assets")
        .getPublicUrl(storagePath);

      if (!urlData?.publicUrl) {
        throw new Error("Failed to generate public URL for uploaded asset.");
      }

      return {
        url: urlData.publicUrl,
        path: storagePath,
      };
    }
  }

  // 4. Guest / Local Mode Fallback: Convert to Data URL for local persistence
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        url: reader.result as string,
        path: `local_${Date.now()}_${file.name}`,
      });
    };
    reader.onerror = () => {
      reject(new Error("Failed to read local file."));
    };
    reader.readAsDataURL(file);
  });
}
