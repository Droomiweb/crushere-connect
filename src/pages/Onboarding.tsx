import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Camera, Check } from "lucide-react";

type OnboardStep = "mode" | "profile" | "interests" | "privacy";

const INTERESTS = [
  "🎸 Music", "📚 Study", "🎮 Gaming", "🏃 Sports", "🎨 Art",
  "🍕 Foodie", "📸 Photography", "✈️ Travel", "🎬 Movies", "💻 Tech",
  "🧘 Wellness", "🎭 Theatre", "📖 Books", "🌿 Nature", "💃 Dance",
  "🎤 Singing", "🏋️ Fitness", "🐾 Pets",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardStep>("mode");
  const [mode, setMode] = useState<"college" | "open" | null>(null);
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [profileVisibility, setProfileVisibility] = useState<"campus" | "everyone">("campus");
  const [blurPhoto, setBlurPhoto] = useState(true);

  const steps: OnboardStep[] = ["mode", "profile", "interests", "privacy"];
  const stepIdx = steps.indexOf(step);
  const progress = ((stepIdx + 1) / steps.length) * 100;

  const toggleInterest = (i: string) => {
    setSelectedInterests(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : prev.length < 8 ? [...prev, i] : prev
    );
  };

  const next = () => {
    const nextStep = steps[stepIdx + 1];
    if (nextStep) setStep(nextStep);
    else navigate("/feed");
  };

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-mobile min-h-screen flex flex-col px-6">
        {/* Header */}
        <div className="flex items-center justify-between pt-6 pb-4">
          <button
            onClick={() => stepIdx > 0 ? setStep(steps[stepIdx - 1]) : navigate("/auth")}
            className="w-10 h-10 rounded-2xl glass-card flex items-center justify-center border border-border active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="text-xs text-muted-foreground font-medium">
            Step {stepIdx + 1} of {steps.length}
          </div>
          {step !== "mode" && (
            <button onClick={next} className="text-primary text-sm font-medium">Skip</button>
          )}
          {step === "mode" && <div className="w-10" />}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gradient-brand rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Steps */}
        {step === "mode" && (
          <div className="animate-slide-up flex-1 flex flex-col">
            <h1 className="font-display font-bold text-3xl mb-2">Choose your mode</h1>
            <p className="text-muted-foreground text-sm mb-8">
              You can switch between modes anytime. This shapes your experience.
            </p>

            <div className="space-y-4 mb-8">
              {/* College Mode */}
              <div
                onClick={() => setMode("college")}
                className={`mode-card p-5 ${mode === "college" ? "selected" : ""}`}
              >
                <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-brand opacity-5" />
                </div>
                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-bold text-lg">College Mode</h3>
                      <span className="text-xs bg-match/20 text-match px-2 py-0.5 rounded-full font-medium">Recommended</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Connect with students on your campus. Campus-verified, extra safe, exclusive access to campus events & rooms.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {["Campus Feed", "College Events", "Verified Peers"].map(t => (
                        <span key={t} className="pill-tag text-[10px]">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${mode === "college" ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                    {mode === "college" && <Check size={12} className="text-white" />}
                  </div>
                </div>
              </div>

              {/* Open Mode */}
              <div
                onClick={() => setMode("open")}
                className={`mode-card p-5 ${mode === "open" ? "selected" : ""}`}
              >
                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-crush flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🌍</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-lg mb-1">Open Mode</h3>
                    <p className="text-muted-foreground text-sm">
                      Connect with anyone near you — not just students. Great for city events, interest groups, and open networking.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {["Open Feed", "City Events", "Interest Rooms"].map(t => (
                        <span key={t} className="pill-tag text-[10px]">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all ${mode === "open" ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                    {mode === "open" && <Check size={12} className="text-white" />}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto pb-10">
              <button
                onClick={next}
                disabled={!mode}
                className="btn-brand w-full py-4 rounded-2xl font-display font-bold text-lg text-white disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === "profile" && (
          <div className="animate-slide-up flex-1 flex flex-col">
            <h1 className="font-display font-bold text-3xl mb-2">Build your profile</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Only your nickname is shown until a mutual crush. Your real name stays private.
            </p>

            {/* Photo upload */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center border-2 border-dashed border-border avatar-blurred">
                  <Camera size={28} className="text-muted-foreground" />
                </div>
                <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow">
                  <span className="text-sm">+</span>
                </button>
                <div className="absolute -top-1 -right-1">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">Blurred</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Real Name (Private)</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  className="crushere-input w-full px-4 py-4 rounded-2xl text-base"
                />
                <p className="text-xs text-muted-foreground mt-1">Only revealed after a mutual match ✨</p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Nickname (Public)</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="StargazerX, CoffeeAddict..."
                  className="crushere-input w-full px-4 py-4 rounded-2xl text-base"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wider">Bio</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 120))}
                  placeholder="3rd year CS student. Loves chai and late-night code sessions..."
                  rows={3}
                  className="crushere-input w-full px-4 py-3 rounded-2xl text-base resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/120</p>
              </div>
            </div>

            <div className="mt-auto pb-10">
              <button
                onClick={next}
                disabled={!nickname.trim()}
                className="btn-brand w-full py-4 rounded-2xl font-display font-bold text-lg text-white disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === "interests" && (
          <div className="animate-slide-up flex-1 flex flex-col">
            <h1 className="font-display font-bold text-3xl mb-2">Your interests</h1>
            <p className="text-muted-foreground text-sm mb-2">
              Pick up to 8 things you vibe with. This helps us find your people.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              {selectedInterests.length}/8 selected
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {INTERESTS.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`pill-tag text-sm transition-all duration-200 ${selectedInterests.includes(interest) ? "active scale-105" : "hover:border-primary/50"}`}
                >
                  {interest}
                </button>
              ))}
            </div>

            <div className="mt-auto pb-10">
              <button
                onClick={next}
                disabled={selectedInterests.length < 1}
                className="btn-brand w-full py-4 rounded-2xl font-display font-bold text-lg text-white disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === "privacy" && (
          <div className="animate-slide-up flex-1 flex flex-col">
            <h1 className="font-display font-bold text-3xl mb-2">Privacy first 🔒</h1>
            <p className="text-muted-foreground text-sm mb-8">
              You're in full control. Change these anytime in settings.
            </p>

            <div className="space-y-4">
              {/* Visibility */}
              <div className="profile-card p-4">
                <p className="font-display font-semibold text-sm mb-1">Profile Visibility</p>
                <p className="text-muted-foreground text-xs mb-3">Who can see and send you a silent crush?</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["campus", "everyone"] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setProfileVisibility(v)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${profileVisibility === v ? "bg-gradient-brand text-white shadow-glow" : "bg-muted text-muted-foreground"}`}
                    >
                      {v === "campus" ? "🎓 Campus Only" : "🌍 Everyone"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blur photo */}
              <div className="profile-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-display font-semibold text-sm mb-0.5">Blur Profile Photo</p>
                  <p className="text-muted-foreground text-xs">Reveal only after mutual match</p>
                </div>
                <button
                  onClick={() => setBlurPhoto(!blurPhoto)}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${blurPhoto ? "bg-gradient-brand" : "bg-muted"}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${blurPhoto ? "left-[1.625rem]" : "left-0.5"}`} />
                </button>
              </div>

              {/* Anonymous crush */}
              <div className="profile-card p-4 flex items-center justify-between opacity-75">
                <div>
                  <p className="font-display font-semibold text-sm mb-0.5">Anonymous Crush</p>
                  <p className="text-muted-foreground text-xs">Always on — your identity is safe</p>
                </div>
                <div className="w-12 h-6 rounded-full bg-gradient-brand relative">
                  <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow-md" />
                </div>
              </div>

              {/* Premium teaser */}
              <div className="glass-card p-4 rounded-2xl border border-match/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="premium-badge px-2 py-0.5 rounded-full text-match-foreground">Premium</span>
                  <p className="font-display font-semibold text-sm">See who's interested in you</p>
                </div>
                <p className="text-muted-foreground text-xs mb-3">
                  Unlock "Almost Matches" — see who crushed on you before you matched.
                </p>
                <button onClick={() => navigate("/premium")} className="text-xs text-match font-medium">
                  See Premium plans →
                </button>
              </div>
            </div>

            <div className="mt-auto pb-10 pt-6">
              <button
                onClick={next}
                className="btn-brand w-full py-4 rounded-2xl font-display font-bold text-lg text-white"
              >
                Enter Crushere 💜
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
