import { Home, Heart, Sparkles, Users, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Feed", icon: Home, path: "/feed" },
  { label: "Crush", icon: Heart, path: "/crushes" },
  { label: "Matches", icon: Sparkles, path: "/matches" },
  { label: "Rooms", icon: Users, path: "/rooms" },
  { label: "Profile", icon: User, path: "/profile" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 safe-bottom max-w-mobile mx-auto px-2">
      {tabs.map(({ label, icon: Icon, path }) => {
        const active = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl transition-all duration-200",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <div className={cn(
              "relative p-1.5 rounded-xl transition-all duration-200",
              active && "bg-primary/15"
            )}>
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
                className={cn(
                  "transition-all duration-200",
                  active && "drop-shadow-[0_0_6px_hsl(277_65%_42%_/_0.8)]"
                )}
                fill={label === "Crush" && active ? "currentColor" : "none"}
              />
              {label === "Matches" && (
                <span className="notif-dot absolute -top-0.5 -right-0.5" />
              )}
            </div>
            <span className={cn(
              "text-[10px] font-medium font-display transition-all",
              active ? "text-primary" : "text-muted-foreground"
            )}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
