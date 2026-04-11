import { Button } from "@/components/ui/button";
import { StorageImage } from "@/components/ui/storage-image";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import PostComments from "./PostComments";

interface PhotoCardProps {
  post: {
    id: string;
    user_id: string;
    image_url: string | null;
    caption: string | null;
    created_at: string;
    profileName: string;
  };
  likes: { user_id: string }[];
  comments: { id: string; user_id: string; content: string; created_at: string; profileName: string }[];
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export default function PhotoCard({ post, likes, comments, onDelete, onRefresh }: PhotoCardProps) {
  const { user, isCoach } = useAuth();

  const isLiked = likes.some((l) => l.user_id === user?.id);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleLike = async () => {
    if (!user) return;
    try {
      if (isLiked) {
        await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
      } else {
        await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
      }
      onRefresh();
    } catch {
      toast.error("Like fehlgeschlagen");
    }
  };

  return (
    <Card className="card-elevated overflow-hidden border-border/60">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-semibold">
              {getInitials(post.profileName)}
            </div>
            <div>
              <p className="text-sm font-semibold">{post.profileName}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: de })}
              </p>
            </div>
          </div>
          {(isCoach || post.user_id === user?.id) && (
            <Button variant="ghost" size="icon" onClick={() => onDelete(post.id)} className="min-w-[36px] min-h-[36px] text-muted-foreground hover:text-destructive rounded-full">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {post.image_url && (
          <div className="flex justify-center bg-muted/20 overflow-hidden">
            <StorageImage
              bucket="meal-photos"
              storedPath={post.image_url}
              alt="Foto"
              className="w-auto max-w-full object-contain"
              style={{ maxHeight: "500px", aspectRatio: "9/16" }}
              loading="lazy"
            />
          </div>
        )}

        <div className="px-4 pb-4">
          {post.caption && <p className="mt-3 text-sm leading-relaxed">{post.caption}</p>}

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/60">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5 min-h-[40px] rounded-full px-4 transition-all",
                isLiked ? "text-red-500 bg-red-500/10 hover:bg-red-500/15" : "hover:bg-muted"
              )}
              onClick={handleLike}
            >
              <Heart className={cn("h-4 w-4 transition-transform", isLiked && "fill-red-500 scale-110")} />
              <span className="text-sm font-medium">{likes.length}</span>
            </Button>
          </div>

          <PostComments postId={post.id} comments={comments} onRefresh={onRefresh} />
        </div>
      </CardContent>
    </Card>
  );
}
