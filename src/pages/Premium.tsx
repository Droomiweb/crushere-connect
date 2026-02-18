import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Zap, Star, Shield, Clock, Eye, ArrowLeft } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const PLANS = [
  { id: "monthly", label: "Monthly", price: "₹49", period: "/month", badge: null, original: null },
  { id: "semester", label: "Semester", price: "₹199", period: "/6 months", badge: "🔥 Best Value", original: "₹294" },
  { id: "annual", label: "Annual", price: "₹349", period: "/year", badge: "💜 Most Popular", original: "₹588" },
];

const FEATURES = [
  { icon: Zap, title: "10 Crushes/Day", desc: "vs. 3 on free" },
  { icon: Eye, title: "Almost Matches", desc: "See who crushed you without matching yet" },
  { icon: Clock, title: "Faster Reveal", desc: "Reveal identity in 6 hours instead of 48" },
  { icon: Star, title: "Profile Boost", desc: "Top of campus feed during peak hours (6–10 PM)" },
  { icon: Shield, title: "Priority Support", desc: "Human support within 2 hours" },
];

export default function Premium() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState("semester");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate("/feed"); }, 1500);
  };

  const activePlan = PLANS.find(p => p.id === selectedPlan);

  return (
    <AppLayout hideNav>
      <div className="px-4 pt-6 pb-32">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl glass-card border border-border flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
        </div>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-gradient-match mx-auto flex items-center justify-center mb-4 shadow-match animate-pulse-glow">
            <Star size={28} className="text-white fill-white" />
          </div>
          <h1 className="font-display font-bold text-3xl mb-2">
            Crushere <span className="text-gradient-match">Premium</span>
          </h1>
          <p className="text-muted-foreground text-sm">Made for students. Priced like a chai. No aggressive upselling — ever.</p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {PLANS.map(plan => (
            <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
              className={`relative rounded-2xl p-3 border-2 transition-all text-center ${selectedPlan === plan.id ? "border-match bg-match/10 shadow-match" : "border-border bg-card"}`}>
              {plan.badge && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] bg-gradient-match text-match-foreground px-2 py-0.5 rounded-full font-bold">
                  {plan.badge}
                </div>
              )}
              <p className="font-display font-bold text-lg">{plan.price}</p>
              <p className="text-muted-foreground text-[10px]">{plan.period}</p>
              {plan.original && <p className="text-[10px] text-muted-foreground line-through">{plan.original}</p>}
              <p className="font-medium text-xs mt-1">{plan.label}</p>
            </button>
          ))}
        </div>

        <div className="profile-card p-4 rounded-3xl mb-6">
          <h3 className="font-display font-semibold text-sm mb-4">Everything in Premium</h3>
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-match flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-display font-semibold text-sm">{title}</p>
                  <p className="text-muted-foreground text-xs">{desc}</p>
                </div>
                <Check size={14} className="text-match ml-auto flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card border border-primary/20 rounded-2xl p-3">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            🎓 Verified students get an additional <span className="text-foreground font-medium">30-day free trial</span>. Cancel anytime. No hidden fees.
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-mobile mx-auto px-4 pb-8 pt-3" style={{ background: "linear-gradient(to top, hsl(var(--background)) 70%, transparent)" }}>
        <button onClick={handleSubscribe} disabled={loading}
          className="btn-match w-full py-4 rounded-2xl font-display font-bold text-lg text-match-foreground flex items-center justify-center gap-2 disabled:opacity-60">
          {loading ? <div className="w-5 h-5 border-2 border-match-foreground/30 border-t-match-foreground rounded-full animate-spin" /> : "Start 7-Day Free Trial →"}
        </button>
        <p className="text-center text-muted-foreground text-xs mt-2">
          Then {activePlan?.price} {activePlan?.period} • Cancel anytime
        </p>
      </div>
    </AppLayout>
  );
}
