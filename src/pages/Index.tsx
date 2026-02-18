import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import heroBg from "@/assets/hero-bg.jpg";

export default function Index() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="relative w-full max-w-mobile min-h-screen flex flex-col overflow-hidden">
        {/* Hero BG */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt="Crushere background"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, hsl(258 40% 8% / 0.4) 0%, hsl(258 40% 8%) 60%)" }} />
        </div>

        {/* Floating decorative hearts */}
        <div className="absolute top-16 right-8 w-16 h-16 rounded-full bg-primary/10 animate-float" style={{ animationDelay: "0s" }} />
        <div className="absolute top-32 left-6 w-8 h-8 rounded-full bg-crush/10 animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-48 right-16 w-5 h-5 rounded-full bg-accent/20 animate-float" style={{ animationDelay: "0.5s" }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col min-h-screen px-6 pt-20 pb-12">
          {/* Logo */}
          <div className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow animate-pulse-glow">
                <span className="text-xl">💜</span>
              </div>
              <span className="font-display font-bold text-2xl text-gradient-brand">Crushere</span>
            </div>
            <span className="text-xs font-medium text-muted-foreground tracking-widest uppercase">Campus connections reimagined</span>
          </div>

          {/* Hero Text */}
          <div className={`mt-16 transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <h1 className="font-display font-bold text-5xl leading-[1.1] mb-4">
              Find your <span className="text-gradient-crush">crush</span><br />
              <span className="text-gradient-brand">anonymously</span> 💜
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              A safe space for college students to connect, vibe, and reveal only when the feeling is mutual.
            </p>
          </div>

          {/* Feature pills */}
          <div className={`mt-8 flex flex-wrap gap-2 transition-all duration-700 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            {["🔒 Anonymous first", "💞 Mutual match only", "📍 Campus-verified", "✨ No creeps policy"].map((f) => (
              <span key={f} className="pill-tag">{f}</span>
            ))}
          </div>

          {/* Stats */}
          <div className={`mt-10 grid grid-cols-3 gap-4 transition-all duration-700 delay-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            {[
              { val: "12K+", label: "Students" },
              { val: "3.2K", label: "Matches" },
              { val: "98%", label: "Privacy" },
            ].map(({ val, label }) => (
              <div key={label} className="profile-card p-3 text-center">
                <p className="font-display font-bold text-xl text-gradient-brand">{val}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className={`mt-auto pt-10 flex flex-col gap-3 transition-all duration-700 delay-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <button
              onClick={() => navigate("/auth")}
              className="btn-brand w-full py-4 rounded-2xl font-display font-bold text-lg text-white"
            >
              Start Crushing 💜
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="w-full py-4 rounded-2xl font-display font-semibold text-base glass-card text-foreground border border-border/50"
            >
              Already have an account? Log in
            </button>
            <p className="text-center text-muted-foreground text-xs mt-2">
              By continuing, you agree to our Privacy Policy & Terms of Use.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
