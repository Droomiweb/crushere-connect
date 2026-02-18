import { useState } from "react";
import { Heart, Info, Zap, Lock } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";

const PROFILES = [
  { id: 1, nickname: "StargazerX", dept: "Computer Science", year: "3rd Year", bio: "Late night coder, chai enthusiast, Spotify addict.", interests: ["💻 Tech", "☕ Foodie", "🎸 Music", "📚 Study"], mutual: 3 },
  { id: 2, nickname: "RainyDayMuse", dept: "Literature", year: "2nd Year", bio: "Finds poetry in everything. Currently reading Murakami.", interests: ["📖 Books", "🎬 Movies", "🎨 Art", "✈️ Travel"], mutual: 5 },
  { id: 3, nickname: "CosmicVibes", dept: "Physics", year: "4th Year", bio: "Astrophysics major who also loves underground music.", interests: ["🎸 Music", "🌿 Nature", "📸 Photography"], mutual: 2 },
];

export default function Crushes() {
  const navigate = useNavigate();
  const [crushSent, setCrushSent] = useState<Record<number, boolean>>({});
  const [crushCount] = useState(3); // daily limit
  const [activeProfile, setActiveProfile] = useState(0);
  const [heartAnim, setHeartAnim] = useState(false);

  const profile = PROFILES[activeProfile % PROFILES.length];

  const sendCrush = (id: number) => {
    if (crushCount <= 0) return;
    setHeartAnim(true);
    setTimeout(() => {
      setCrushSent(prev => ({ ...prev, [id]: true }));
      setHeartAnim(false);
    }, 700);
  };

  return (
    <AppLayout>
      <div className="px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl">Silent Crush 💜</h1>
            <p className="text-muted-foreground text-xs">They only know if it's mutual</p>
          </div>
          <div className="glass-card border border-border rounded-2xl px-3 py-2 flex items-center gap-1.5">
            <Heart size={14} className="text-crush fill-crush" />
            <span className="font-display font-bold text-sm">{crushCount - Object.keys(crushSent).length}</span>
            <span className="text-muted-foreground text-xs">/ day</span>
          </div>
        </div>

        {/* Info banner */}
        <div className="glass-card border border-primary/20 rounded-2xl p-3 mb-5 flex gap-2.5">
          <Lock size={16} className="text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your identity stays <span className="text-foreground font-medium">completely anonymous</span> until BOTH of you send a crush. No one-sided reveals — ever.
          </p>
        </div>

        {/* Profile swipe card */}
        <div className="relative mb-6">
          {/* Stack effect */}
          <div className="absolute inset-x-4 bottom-0 h-full profile-card opacity-30 rounded-3xl" />
          <div className="absolute inset-x-2 bottom-1 h-full profile-card opacity-60 rounded-3xl" />

          {/* Main card */}
          <div className="relative profile-card rounded-3xl overflow-hidden p-6 animate-fade-in-scale">
            {/* Blurred avatar */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-gradient-brand flex items-center justify-center avatar-blurred">
                  <span className="text-4xl">👤</span>
                </div>
                <div className="absolute inset-0 rounded-3xl flex items-center justify-center bg-muted/20">
                  <Lock size={20} className="text-white/70" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-muted border border-border rounded-xl px-2 py-1">
                  <span className="text-xs text-muted-foreground">Blurred</span>
                </div>
              </div>
            </div>

            {/* Profile info */}
            <div className="text-center mb-4">
              <h2 className="font-display font-bold text-xl mb-1">{profile.nickname}</h2>
              <p className="text-muted-foreground text-sm">{profile.dept} • {profile.year}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-xs text-accent">{profile.mutual} mutual interests</span>
              </div>
            </div>

            <p className="text-sm text-center text-muted-foreground mb-4 leading-relaxed">"{profile.bio}"</p>

            {/* Interests */}
            <div className="flex flex-wrap gap-2 justify-center mb-5">
              {profile.interests.map(i => (
                <span key={i} className="pill-tag text-xs">{i}</span>
              ))}
            </div>

            {/* Crush button */}
            <div className="flex gap-3">
              <button
                onClick={() => setActiveProfile(p => p + 1)}
                className="flex-1 py-4 rounded-2xl glass-card border border-border font-display font-semibold text-sm text-muted-foreground active:scale-95 transition-transform"
              >
                Skip →
              </button>
              <button
                onClick={() => !crushSent[profile.id] && sendCrush(profile.id)}
                className={`flex-[2] py-4 rounded-2xl font-display font-bold text-base text-white flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  crushSent[profile.id]
                    ? "bg-muted text-muted-foreground"
                    : "btn-crush"
                }`}
              >
                <Heart
                  size={18}
                  className={`transition-all duration-300 ${heartAnim ? "animate-heartbeat fill-white" : crushSent[profile.id] ? "" : "fill-white"}`}
                />
                {crushSent[profile.id] ? "Crush Sent! ✨" : "Send Crush 💜"}
              </button>
            </div>
          </div>
        </div>

        {/* Premium upsell — subtle */}
        <div className="glass-card border border-match/20 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-match/15 flex items-center justify-center">
              <Zap size={18} className="text-match" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="premium-badge px-2 py-0.5 rounded-full text-match-foreground bg-gradient-match">Premium</span>
                <p className="font-display font-semibold text-sm">Get 10 more crushes/day</p>
              </div>
              <p className="text-muted-foreground text-xs">Plus see who almost matched you. From ₹49/month.</p>
            </div>
            <button
              onClick={() => navigate("/premium")}
              className="text-match text-xs font-bold whitespace-nowrap"
            >
              Try free →
            </button>
          </div>
        </div>

        {/* Profile list (secondary) */}
        <div className="mb-4">
          <h3 className="font-display font-semibold text-sm text-muted-foreground mb-3">Others on campus</h3>
          <div className="space-y-3">
            {PROFILES.map(p => (
              <div key={p.id} className="feed-card p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center avatar-blurred">
                  <span className="text-lg">👤</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-sm">{p.nickname}</p>
                  <p className="text-muted-foreground text-xs truncate">{p.dept} • {p.mutual} mutual interests</p>
                </div>
                <button
                  onClick={() => !crushSent[p.id] && sendCrush(p.id)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    crushSent[p.id] ? "bg-primary/20" : "btn-crush"
                  }`}
                >
                  <Heart size={16} className={crushSent[p.id] ? "text-primary" : "text-white fill-white"} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
