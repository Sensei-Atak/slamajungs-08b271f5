import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profileName: string;
}

interface PostCommentsProps {
  postId: string;
  comments: Comment[];
  onRefresh: () => void;
}

export default function PostComments({ postId, comments, onRefresh }: PostCommentsProps) {
  const { user, isCoach } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!user || !text.trim()) return;
    setPosting(true);
    try {
      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        user_id: user.id,
        content: text.trim(),
      });
      if (error) throw error;
      setText("");
      onRefresh();
    } catch {
      toast.error("Kommentar fehlgeschlagen");
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("post_comments").delete().eq("id", id);
    if (error) {
      toast.error("Löschen fehlgeschlagen");
      return;
    }
    onRefresh();
  };

  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground -ml-2"
        onClick={() => setShowComments(!showComments)}
      >
        <MessageCircle className="h-4 w-4" />
        <span className="text-sm">
          {comments.length > 0 ? `${comments.length} Kommentar${comments.length > 1 ? "e" : ""}` : "Kommentieren"}
        </span>
      </Button>

      {showComments && (
        <div className="mt-2 space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 text-sm">
              <div className="flex-1">
                <span className="font-medium">{c.profileName}</span>{" "}
                <span className="text-muted-foreground">{c.content}</span>
                <p className="text-xs text-muted-foreground/60">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: de })}
                </p>
              </div>
              {(c.user_id === user?.id || isCoach) && (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(c.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              placeholder="Kommentar schreiben..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePost()}
              className="min-h-[40px]"
            />
            <Button size="icon" disabled={!text.trim() || posting} onClick={handlePost} className="min-h-[40px] min-w-[40px]">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
