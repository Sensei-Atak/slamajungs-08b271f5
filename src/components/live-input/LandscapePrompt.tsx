import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

export function LandscapePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const check = () => {
      const isPortrait = window.matchMedia("(orientation: portrait)").matches;
      const isSmall = window.innerWidth < 768;
      setShowPrompt(isPortrait && isSmall);
    };

    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);

    const mql = window.matchMedia("(orientation: portrait)");
    mql.addEventListener("change", check);

    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
      mql.removeEventListener("change", check);
    };
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center gap-6 p-8">
      <RotateCcw className="h-16 w-16 text-primary animate-spin" style={{ animationDuration: "3s" }} />
      <h2 className="text-xl font-bold text-foreground text-center">
        Bitte drehe dein Gerät ins Querformat
      </h2>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        Die Live-Statistiken sind für das Querformat optimiert.
      </p>
    </div>
  );
}
