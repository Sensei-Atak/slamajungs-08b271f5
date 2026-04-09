import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

/**
 * Extract the object path from a stored value that might be a full public URL or a plain path.
 */
function extractPath(bucket: string, storedValue: string): string {
  const publicPattern = `/storage/v1/object/public/${bucket}/`;
  const idx = storedValue.indexOf(publicPattern);
  if (idx !== -1) {
    let path = storedValue.substring(idx + publicPattern.length);
    const qIdx = path.indexOf("?");
    if (qIdx !== -1) path = path.substring(0, qIdx);
    return path;
  }
  return storedValue;
}

export async function getSignedUrl(
  bucket: string,
  storedValue: string,
  expiresIn = 3600
): Promise<string | null> {
  const path = extractPath(bucket, storedValue);
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) return null;
  return data.signedUrl;
}

/**
 * React hook that resolves a stored path / legacy public URL into a signed URL.
 */
export function useSignedUrl(
  bucket: string,
  storedValue: string | null | undefined
): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!storedValue) {
      setUrl(null);
      return;
    }
    let cancelled = false;
    getSignedUrl(bucket, storedValue).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [bucket, storedValue]);

  return url;
}
