import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Utensils, MapPin, Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostTypeSelectorProps {
  onSelect: (type: "meal" | "hangout" | "photo") => void;
}

export default function PostTypeSelector({ onSelect }: PostTypeSelectorProps) {
  const [open, setOpen] = useState(false);

  const options = [
    { type: "meal" as const, label: "Mahlzeit", icon: Utensils, color: "text-orange-500 bg-orange-500/10 border-orange-500/30" },
    { type: "hangout" as const, label: "Verabredung", icon: MapPin, color: "text-blue-500 bg-blue-500/10 border-blue-500/30" },
    { type: "photo" as const, label: "Foto-Post", icon: Camera, color: "text-purple-500 bg-purple-500/10 border-purple-500/30" },
  ];

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="min-h-[44px] gap-2">
        <Plus className="h-4 w-4" />
        Posten
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {options.map((opt) => (
        <Button
          key={opt.type}
          variant="outline"
          className={cn("min-h-[44px] gap-2 border", opt.color)}
          onClick={() => {
            onSelect(opt.type);
            setOpen(false);
          }}
        >
          <opt.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{opt.label}</span>
        </Button>
      ))}
      <Button
        variant="ghost"
        size="icon"
        className="min-h-[44px] min-w-[44px]"
        onClick={() => setOpen(false)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
