import { useSignedUrl } from "@/lib/storage";
import { Skeleton } from "@/components/ui/skeleton";

interface StorageImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  bucket: string;
  storedPath: string;
}

export function StorageImage({ bucket, storedPath, className, ...props }: StorageImageProps) {
  const url = useSignedUrl(bucket, storedPath);

  if (!url) {
    return <Skeleton className={className} />;
  }

  return <img src={url} className={className} {...props} />;
}
