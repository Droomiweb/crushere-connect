import { useState } from "react";
import { ArrowLeft, Shield, Eye, EyeOff, Bell, Users, Trash2, ChevronRight, Lock } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";

export default function Privacy() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    blurPhoto: true,
    anonymousFeed: true,
    campusOnly: true,
    activityStatus: false,
    matchNotifs: true,
    crushNotifs: true,
    roomNotifs: false,
    eventNotifs: true,
    allowScreenshot: false,
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const Toggle = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${value ? "bg-gradient-brand" : "bg-muted"}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${value ? "left-[1.625rem]" : "left-0.5"}`} />
    </button>
  );

  const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} className="text-primary" />
        <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">{title}</h3>
      </div>
      <div className="profile-card rounded-2xl divide-y divide-border">
        {children}
      </div>
    </div>
  );

  const Row = ({ label, desc, value, onToggle }: { label: string; desc?: string; value: boolean; onToggle: () => void }) => (
    <div className="flex items-center gap-3 p-4">
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-sm">{label}</p>
        {desc && <p className="text-muted-foreground text-xs mt-0.5">{desc}</p>}
      </div>
      <Toggle value={value} onToggle={onToggle} />
    </div>
  );

  return (
    <AppLayout hideNav>
      <div className="px-4 pt-6 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl glass-card border border-border flex items-center justify-center">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-display font-bold text-xl">Privacy & Safety 🔒</h1>
            <p className="text-muted-foreground text-xs">You're in full control</p>
          </div>
        </div>

        {/* Trust banner */}
        <div className="glass-card border border-primary/20 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={16} className="text-primary" />
            <p className="font-display font-semibold text-sm">Crushere Promise</p>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            We never sell your data. Crushes are anonymous until mutual. Rooms leave no trace. Your number is never visible.
          </p>
        </div>

        <Section title="Profile Privacy" icon={Eye}>
          <Row
            label="Blur Profile Photo"
            desc="Photo revealed only after mutual match"
            value={settings.blurPhoto}
            onToggle={() => toggle("blurPhoto")}
          />
          <Row
            label="Anonymous on Feed"
            desc="Post with your nickname, not real name"
            value={settings.anonymousFeed}
            onToggle={() => toggle("anonymousFeed")}
          />
          <Row
            label="Show Activity Status"
            desc="Let matches see when you're online"
            value={settings.activityStatus}
            onToggle={() => toggle("activityStatus")}
          />
        </Section>

        <Section title="Visibility" icon={Users}>
          <Row
            label="Campus Only Mode"
            desc="Only verified campus members can find you"
            value={settings.campusOnly}
            onToggle={() => toggle("campusOnly")}
          />
          <Row
            label="Block Screenshots"
            desc="Prevent screenshots in chat (Android only)"
            value={settings.allowScreenshot}
            onToggle={() => toggle("allowScreenshot")}
          />
        </Section>

        <Section title="Notifications" icon={Bell}>
          <Row label="Match Alerts" value={settings.matchNotifs} onToggle={() => toggle("matchNotifs")} />
          <Row label="Crush Notifications" desc="Notified anonymously when someone crushes you" value={settings.crushNotifs} onToggle={() => toggle("crushNotifs")} />
          <Row label="Room Invites" value={settings.roomNotifs} onToggle={() => toggle("roomNotifs")} />
          <Row label="Event Updates" value={settings.eventNotifs} onToggle={() => toggle("eventNotifs")} />
        </Section>

        {/* Actions */}
        <div className="profile-card rounded-2xl divide-y divide-border mb-5">
          {[
            { label: "Blocked Users", icon: Lock, color: "text-muted-foreground" },
            { label: "Download My Data", icon: ChevronRight, color: "text-muted-foreground" },
          ].map(({ label, icon: Icon, color }) => (
            <button key={label} className="flex items-center gap-3 p-4 w-full">
              <p className="flex-1 text-left font-display font-semibold text-sm">{label}</p>
              <Icon size={16} className={color} />
            </button>
          ))}
          <button className="flex items-center gap-3 p-4 w-full">
            <p className="flex-1 text-left font-display font-semibold text-sm text-crush">Delete Account</p>
            <Trash2 size={16} className="text-crush" />
          </button>
        </div>

        <p className="text-center text-muted-foreground text-xs">
          Questions? Contact <span className="text-primary">privacy@crushere.app</span>
        </p>
      </div>
    </AppLayout>
  );
}
