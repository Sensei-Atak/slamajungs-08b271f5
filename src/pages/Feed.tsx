import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Plus, Utensils, ImageIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";

interface MealPost {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  profiles: { name: string; avatar_url: string | null } | null;
}

export default function Feed() {
  const { user, isCoach } = useAuth();
  const [meals, setMeals] = useState<MealPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMeals = async () => {
    const { data: mealsData } = await supabase
      .from("meals")
      .select("*")
      .order("created_at", { ascending: false });
    if (mealsData) {
      const userIds = [...new Set(mealsData.map((m) => m.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", userIds);
      const profileMap = new Map(profilesData?.map((p) => [p.id, p]) || []);
      setMeals(
        mealsData.map((m) => ({
          ...m,
          profiles: profileMap.get(m.user_id) || null,
        })) as MealPost[]
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("meal-photos")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("meal-photos")
        .getPublicUrl(path);

      const { error } = await supabase.from("meals").insert({
        user_id: user.id,
        image_url: urlData.publicUrl,
        caption: caption || null,
      });
      if (error) throw error;

      setCaption("");
      setFile(null);
      setShowForm(false);
      fetchMeals();
      toast.success("Mahlzeit gepostet!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (meal: MealPost) => {
    const { error } = await supabase.from("meals").delete().eq("id", meal.id);
    if (error) {
      toast.error("Fehler beim Löschen");
      return;
    }
    setMeals((prev) => prev.filter((m) => m.id !== meal.id));
    toast.success("Beitrag gelöscht");
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (loading) {
    return <div className="flex justify-center py-12 text-muted-foreground">Laden...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mahlzeiten-Feed</h1>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="min-h-[44px] gap-2"
        >
          <Plus className="h-4 w-4" />
          Mahlzeit posten
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={handlePost} className="space-y-3">
              <div>
                <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-border rounded-lg p-6 justify-center hover:border-primary/50 transition-colors">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {file ? file.name : "Foto auswählen"}
                  </span>
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              <Textarea
                placeholder="Beschreibung (optional, max. 280 Zeichen)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={280}
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={!file || uploading}
                  className="min-h-[44px]"
                >
                  {uploading ? "Wird hochgeladen..." : "Veröffentlichen"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setFile(null);
                    setCaption("");
                  }}
                  className="min-h-[44px]"
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {meals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Utensils className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Noch keine Mahlzeiten gepostet. Sei der Erste!
            </p>
          </CardContent>
        </Card>
      ) : (
        meals.map((meal) => (
          <Card key={meal.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                    {meal.profiles
                      ? getInitials(meal.profiles.name)
                      : "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {meal.profiles?.name || "Unbekannt"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(meal.created_at), {
                        addSuffix: true,
                        locale: de,
                      })}
                    </p>
                  </div>
                </div>
                {(isCoach || meal.user_id === user?.id) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(meal)}
                    className="min-w-[44px] min-h-[44px] text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <img
                src={meal.image_url}
                alt="Mahlzeit"
                className="w-full rounded-lg object-cover max-h-96"
                loading="lazy"
              />
              {meal.caption && (
                <p className="mt-2 text-sm">{meal.caption}</p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
