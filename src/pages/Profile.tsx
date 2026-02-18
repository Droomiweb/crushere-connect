import { useState } from "react";
import { Settings, Shield, Star, Camera, Edit3, ChevronRight, Heart, Sparkles, Users, Award } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";

const INTERESTS = ["💻 Tech", "☕ Foodie", "🎸 Music", "📚 Study", "📸 Photography"];

const STATS = [
  { label: "Crushes", value: "12", icon: Heart },
  { label: "Matches", value: "3", icon: Sparkles },
  { label: "Rooms", value: "7", icon: Users },
];

export default function Profile() {
  const navigate = useNavigate();
  const [completionPct] = useState(75);

  return (
    <AppLayout>
      <div className="px-4 pt-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-bold text-2xl">Profile</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/privacy")}
              className="w-10 h-10 rounded-2xl glass-card border border-border flex items-center justify-center"
            >
              <Shield size={18} className="text-foreground" />
            </button>
            <button className="w-10 h-10 rounded-2xl glass-card border border-border flex items-center justify-center">
              <Settings size={18} className="text-foreground" />
            </button>
          </div>
        </div>

        {/* Profile card */}
        <div className="profile-card p-5 rounded-3xl mb-5">
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-3xl bg-gradient-brand flex items-center justify-center avatar-blurred">
                <span className="text-3xl">👤</span>
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-gradient-brand flex items-center justify-center">
                <Camera size={12} className="text-white" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-display font-bold text-xl">MidnightMuse</h2>
                <button>
                  <Edit3 size={14} className="text-muted-foreground" />
                </button>
              </div>
              <p className="text-muted-foreground text-sm">Arjun M. • 3rd Year CS</p>
              <p className="text-muted-foreground text-xs">MIT Manipal</p>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs text-muted-foreground">Active now</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            "Late night coder, chai enthusiast, Spotify addict. Building things that matter."
          </p>

          <div className="flex flex-wrap gap-1.5">
            {INTERESTS.map(i => (
              <span key={i} className="pill-tag text-xs">{i}</span>
            ))}
            <button className="pill-tag text-xs border-dashed">+ Add</button>
          </div>
        </div>

        {/* Profile completion */}
        <div className="profile-card p-4 rounded-2xl mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-display font-semibold text-sm">Profile Strength</p>
            <span className="text-primary font-bold text-sm">{completionPct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-brand rounded-full transition-all duration-700"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Add photo", done: false },
              { label: "Add bio", done: true },
              { label: "Verify college", done: false },
            ].map(({ label, done }) => (
              <div key={label} className={`flex items-center gap-1.5 text-xs ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${done ? "bg-primary border-primary" : "border-muted-foreground/50"}`}>
                  {done && <span className="text-[8px] text-white font-bold">✓</span>}
                </div>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {STATS.map(({ label, value, icon: Icon }) => (
            <div key={label} className="profile-card p-3 rounded-2xl text-center">
              <Icon size={16} className="text-primary mx-auto mb-1" />
              <p className="font-display font-bold text-xl text-gradient-brand">{value}</p>
              <p className="text-muted-foreground text-xs">{label}</p>
            </div>
          ))}
        </div>

        {/* Premium promo */}
        <div className="mb-5">
          <button
            onClick={() => navigate("/premium")}
            className="w-full profile-card p-4 rounded-2xl flex items-center gap-3 border border-match/20"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-match flex items-center justify-center">
              <Award size={18} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="premium-badge px-2 py-0.5 rounded-full text-match-foreground bg-gradient-match">Premium</span>
                <p className="font-display font-semibold text-sm">Upgrade for ₹49/mo</p>
              </div>
              <p className="text-muted-foreground text-xs">10 crushes/day, faster reveal, profile boost</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Menu */}
        <div className="profile-card rounded-2xl divide-y divide-border">
          {[
            { label: "My Mode: College", sub: "Switch to Open Mode", icon: "🎓" },
            { label: "Blocked Users", sub: "0 blocked", icon: "🚫" },
            { label: "Help & Support", sub: "FAQ, report a problem", icon: "💬" },
            { label: "About Crushere", sub: "v1.0 • Privacy Policy", icon: "ℹ️" },
          ].map(({ label, sub, icon }) => (
            <button key={label} className="flex items-center gap-3 p-4 w-full">
              <span className="text-lg w-8 text-center">{icon}</span>
              <div className="flex-1 text-left">
                <p className="font-display font-semibold text-sm">{label}</p>
                <p className="text-muted-foreground text-xs">{sub}</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground" />
            </button>
          ))}
          <button className="flex items-center gap-3 p-4 w-full">
            <span className="text-lg w-8 text-center">🚪</span>
            <p className="flex-1 text-left font-display font-semibold text-sm text-crush">Sign Out</p>
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
