import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, MapPin, Calendar, Clock, ThumbsUp, ThumbsDown } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { de } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import PostComments from "./PostComments";

interface HangoutCardProps {
  post: {
    id: string;
    user_id: string;
    caption: string | null;
    created_at: string;
    profileName: string;
  };
  details: {
    date: string;
    time: string;
    location: string;
  } | null;
  reactions: { user_id: string; reaction: string }[];
  comments: { id: string; user_id: string; content: string; created_at: string; profileName: string }[];
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export default function HangoutCard({ post, details, reactions, comments, onDelete, onRefresh }: HangoutCardProps) {
  const { user, isCoach } = useAuth();

  const myReaction = reactions.find((r) => r.user_id === user?.id)?.reaction;
  const upCount = reactions.filter((r) => r.reaction === "up").length;
  const downCount = reactions.filter((r) => r.reaction === "down").length;

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleReact = async (reaction: "up" | "down") => {
    if (!user) return;
    try {
      if (myReaction === reaction) {
        await supabase.from("hangout_reactions").delete().eq("post_id", post.id).eq("user_id", user.id);
      } else if (myReaction) {
        await supabase.from("hangout_reactions").update({ reaction }).eq("post_id", post.id).eq("user_id", user.id);
      } else {
        await supabase.from("hangout_reactions").insert({ post_id: post.id, user_id: user.id, reaction });
      }
      onRefresh();
    } catch {
      toast.error("Reaktion fehlgeschlagen");
    }
  };

  return (
    <Card className="card-elevated overflow-hidden border-blue-500/20 dark:border-blue-400/15">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-semibold">
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

        <div className="mx-4 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 p-4 space-y-3 border border-blue-500/10 dark:border-blue-400/10">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
            <div className="w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center">
              <MapPin className="h-3.5 w-3.5" />
            </div>
            Wer hat Bock?
          </div>
          {details && (
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 bg-background/60 dark:bg-background/30 rounded-full px-3 py-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(details.date), "dd.MM.yyyy")}
              </span>
              <span className="flex items-center gap-1.5 bg-background/60 dark:bg-background/30 rounded-full px-3 py-1">
                <Clock className="h-3.5 w-3.5" />
                {details.time.slice(0, 5)} Uhr
              </span>
              <span className="flex items-center gap-1.5 bg-background/60 dark:bg-background/30 rounded-full px-3 py-1">
                <MapPin className="h-3.5 w-3.5" />
                {details.location}
              </span>
            </div>
          )}
          {post.caption && <p className="text-sm leading-relaxed">{post.caption}</p>}
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/60">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5 min-h-[40px] rounded-full px-4 transition-all",
                myReaction === "up" ? "text-green-600 dark:text-green-400 bg-green-500/10 hover:bg-green-500/15" : "hover:bg-muted"
              )}
              onClick={() => handleReact("up")}
            >
              <ThumbsUp className={cn("h-4 w-4", myReaction === "up" && "scale-110")} />
              <span className="text-sm font-medium">{upCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5 min-h-[40px] rounded-full px-4 transition-all",
                myReaction === "down" ? "text-red-500 bg-red-500/10 hover:bg-red-500/15" : "hover:bg-muted"
              )}
              onClick={() => handleReact("down")}
            >
              <ThumbsDown className={cn("h-4 w-4", myReaction === "down" && "scale-110")} />
              <span className="text-sm font-medium">{downCount}</span>
            </Button>
          </div>

          <PostComments postId={post.id} comments={comments} onRefresh={onRefresh} />
        </div>
      </CardContent>
    </Card>
  );
}
