import { Home, Users, Sparkles, MessageCircle, Search } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Home", icon: Home, path: "/feed" },
  { label: "Rooms", icon: Users, path: "/rooms" },
  { label: "Matches", icon: Sparkles, path: "/matches", isCenter: true },
  { label: "Chat", icon: MessageCircle, path: "/chat" },
  { label: "Find", icon: Search, path: "/search" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50 h-20 safe-bottom max-w-mobile mx-auto px-4 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
      {tabs.map(({ label, icon: Icon, path, isCenter }) => {
        const active = location.pathname === path;
        
        if (isCenter) {
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="relative -top-6 group"
            >
              <div className={cn(
                "w-16 h-16 rounded-[2rem] bg-gradient-brand flex items-center justify-center shadow-glow transition-all duration-300 group-hover:scale-110 active:scale-95",
                active ? "rotate-12" : ""
              )}>
                <Icon
                  size={30}
                  className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                  fill={active ? "white" : "none"}
                />
              </div>
              <span className={cn(
                "absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold font-display transition-all",
                active ? "text-primary opacity-100" : "text-muted-foreground opacity-70"
              )}>
                {label}
              </span>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-crush rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg animate-bounce-subtle">
                3
              </div>
            </button>
          );
        }

        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={cn(
              "flex flex-col items-center justify-center gap-1.5 transition-all duration-300",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn(
              "p-1 rounded-xl transition-all duration-300",
              active && "scale-110"
            )}>
              <Icon
                size={24}
                strokeWidth={active ? 2.5 : 1.8}
                className={cn(
                  "transition-all duration-300",
                  active && "drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                )}
                fill={active && (label === "Chat" || label === "Home") ? "currentColor" : "none"}
              />
            </div>
            <span className={cn(
              "text-[9px] font-bold font-display tracking-tighter uppercase transition-all",
              active ? "text-primary opacity-100" : "text-muted-foreground opacity-70"
            )}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
