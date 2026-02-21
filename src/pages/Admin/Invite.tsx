import { useState } from "react";
import { Copy, Share2, QrCode, Users, Gift, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const AdminInvite = () => {
  const [copied, setCopied] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const { toast } = useToast();

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://crushere.connect";

  const generateInviteLink = () => {
    const code = customCode.trim() || Math.random().toString(36).substring(2, 9).toUpperCase();
    const link = `${baseUrl}/register?invite=${code}`;
    setGeneratedLink(link);
    return link;
  };

  const copyLink = async (link?: string) => {
    const toCopy = link || generatedLink || generateInviteLink();
    await navigator.clipboard.writeText(toCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Invite link copied to clipboard." });
  };

  const share = async () => {
    const link = generatedLink || generateInviteLink();
    if (navigator.share) {
      await navigator.share({
        title: "Join Crushere!",
        text: "You're invited to join Crushere — the campus social network 🎓",
        url: link,
      });
    } else {
      copyLink(link);
    }
  };

  const quickInviteLinks = [
    { label: "General Invite", code: "GENERAL" },
    { label: "Beta Invite", code: "BETA2025" },
    { label: "College Partner", code: "CAMPUS" },
    { label: "Referral Bonus", code: "REFER50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Invite Management</h1>
        <p className="text-muted-foreground">Generate and share invite links for new users.</p>
      </div>

      {/* Custom Link Generator */}
      <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur p-6">
        <div className="flex items-center gap-2 mb-4">
          <Gift size={20} className="text-primary" />
          <h2 className="font-bold text-lg">Generate Invite Link</h2>
        </div>

        <div className="flex gap-3 mb-4">
          <input
            value={customCode}
            onChange={e => setCustomCode(e.target.value.toUpperCase())}
            placeholder="Custom invite code (optional)"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
          />
          <Button
            onClick={() => { const l = generateInviteLink(); setGeneratedLink(l); }}
            className="bg-primary hover:bg-primary/80 rounded-xl px-5"
          >
            Generate
          </Button>
        </div>

        {generatedLink && (
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <p className="text-sm text-foreground/80 flex-1 break-all">{generatedLink}</p>
            <button
              onClick={() => copyLink(generatedLink)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                copied ? "bg-green-500/20 text-green-400" : "bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <button
              onClick={share}
              className="w-9 h-9 rounded-lg bg-white/5 text-muted-foreground hover:bg-white/10 flex items-center justify-center flex-shrink-0 transition-all"
            >
              <Share2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Quick Invite Codes */}
      <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={20} className="text-primary" />
          <h2 className="font-bold text-lg">Quick Invite Links</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickInviteLinks.map(({ label, code }) => {
            const link = `${baseUrl}/register?invite=${code}`;
            return (
              <div key={code} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{code}</p>
                </div>
                <button
                  onClick={() => copyLink(link)}
                  className="w-8 h-8 rounded-lg bg-white/5 text-muted-foreground hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-all flex-shrink-0"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: "Join Crushere!", url: link });
                    } else copyLink(link);
                  }}
                  className="w-8 h-8 rounded-lg bg-white/5 text-muted-foreground hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-all flex-shrink-0"
                >
                  <Share2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur p-6">
        <h2 className="font-bold text-lg mb-4">How Invite Links Work</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          {[
            "Share an invite link with a new user.",
            "When they register via the link, the invite code is captured.",
            "Bonus points or perks can be assigned to users who joined via a specific code.",
            "Track referral growth in the Analytics section.",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminInvite;
