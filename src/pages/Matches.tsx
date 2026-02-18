import { useState } from "react";
import { MessageCircle, Sparkles, Lock, Unlock, ChevronRight } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";

const MATCHES = [
  {
    id: 1,
    nickname: "StargazerX",
    dept: "Computer Science",
    revealTimer: 0, // 0 = revealed
    lastMsg: "Hey! Can't believe we matched 😊",
    time: "2m ago",
    unread: 2,
    revealed: true,
    realName: "Arjun M.",
  },
  {
    id: 2,
    nickname: "RainyDayMuse",
    dept: "Literature",
    revealTimer: 18, // hours left
    lastMsg: "Chat unlocked! Say hi anonymously 👋",
    time: "1h ago",
    unread: 0,
    revealed: false,
    realName: null,
  },
  {
    id: 3,
    nickname: "CosmicVibes",
    dept: "Physics",
    revealTimer: 42,
    lastMsg: "Match confirmed! Chat anytime.",
    time: "3h ago",
    unread: 1,
    revealed: false,
    realName: null,
  },
];

const MESSAGES = [
  { id: 1, from: "them", text: "Hey! Can't believe we matched 😊", time: "2:30 PM" },
  { id: 2, from: "me", text: "I know right! I've seen you at the library so many times haha", time: "2:31 PM" },
  { id: 3, from: "them", text: "Same! I always wondered who the person buried in textbooks was 😄", time: "2:32 PM" },
  { id: 4, from: "me", text: "Guilty as charged 📚 Should we grab chai sometime?", time: "2:34 PM" },
];

export default function Matches() {
  const navigate = useNavigate();
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const chatMatch = MATCHES.find(m => m.id === activeChat);

  if (activeChat && chatMatch) {
    return (
      <AppLayout hideNav>
        <div className="flex flex-col h-screen">
          {/* Chat header */}
          <div className="glass-card border-b border-border px-4 pt-6 pb-3 flex items-center gap-3">
            <button
              onClick={() => setActiveChat(null)}
              className="w-9 h-9 rounded-xl glass-card border border-border flex items-center justify-center"
            >
              ←
            </button>
            <div className={`w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center ${!chatMatch.revealed ? "avatar-blurred" : ""}`}>
              <span className="text-lg">👤</span>
            </div>
            <div className="flex-1">
              <p className="font-display font-semibold text-sm">
                {chatMatch.revealed ? chatMatch.realName : chatMatch.nickname}
              </p>
              <p className="text-muted-foreground text-xs">
                {chatMatch.revealed ? "Identity revealed ✨" : `Identity reveals in ${chatMatch.revealTimer}h`}
              </p>
            </div>
            {!chatMatch.revealed && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-match/15 border border-match/20">
                <Lock size={12} className="text-match" />
                <span className="text-xs text-match font-medium">{chatMatch.revealTimer}h</span>
              </div>
            )}
          </div>

          {/* Identity reveal prompt */}
          {!chatMatch.revealed && (
            <div className="mx-4 mt-3 glass-card border border-match/20 rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-match" />
                <p className="text-xs text-muted-foreground flex-1">
                  Identity reveals in <span className="text-match font-medium">{chatMatch.revealTimer} hours</span>
                </p>
                <button onClick={() => navigate("/premium")} className="text-xs text-match font-bold">
                  Reveal faster →
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scroll-hidden px-4 py-4 space-y-3">
            {MESSAGES.map(m => (
              <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.from === "me"
                    ? "bg-gradient-brand text-white rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}>
                  {m.text}
                  <p className={`text-[10px] mt-1 ${m.from === "me" ? "text-white/60" : "text-muted-foreground"}`}>{m.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 py-3 safe-bottom glass-card border-t border-border flex gap-2 items-end">
            <input
              type="text"
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder="Type a message..."
              className="crushere-input flex-1 px-4 py-3 rounded-2xl text-sm"
            />
            <button
              disabled={!msg.trim()}
              className="btn-brand w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40"
              onClick={() => setMsg("")}
            >
              →
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 pt-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl">Your Matches ✨</h1>
          <p className="text-muted-foreground text-xs">Mutual crushes only — congrats!</p>
        </div>

        {/* New match animation card */}
        <div className="profile-card p-5 rounded-3xl mb-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-brand opacity-10" />
          <div className="relative">
            <div className="flex justify-center mb-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-3xl bg-gradient-brand flex items-center justify-center shadow-glow animate-pulse-glow">
                  <Sparkles size={28} className="text-white" />
                </div>
              </div>
            </div>
            <h2 className="font-display font-bold text-lg mb-1">It's a Match! 🎉</h2>
            <p className="text-muted-foreground text-xs mb-3">
              You and <span className="text-foreground font-medium">StargazerX</span> both crushed on each other
            </p>
            <button
              onClick={() => setActiveChat(1)}
              className="btn-brand px-6 py-2.5 rounded-xl font-display font-semibold text-sm text-white"
            >
              Start Chatting →
            </button>
          </div>
        </div>

        {/* Almost Matches - Premium */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-sm">Almost Matches</h3>
            <span className="premium-badge px-2 py-0.5 rounded-full text-match-foreground bg-gradient-match">Premium</span>
          </div>
          <div className="glass-card border border-match/20 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-muted relative overflow-hidden">
                <div className="absolute inset-0 avatar-blurred bg-gradient-brand opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock size={16} className="text-white/70" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-display font-semibold text-sm">Someone crushed on you 💜</p>
                <p className="text-muted-foreground text-xs">They haven't matched yet — but they're interested!</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/premium")}
              className="btn-match w-full py-2.5 rounded-xl font-display font-semibold text-sm text-match-foreground flex items-center justify-center gap-2"
            >
              <Unlock size={14} />
              Unlock for ₹49/month
            </button>
          </div>
        </div>

        {/* Matches list */}
        <div>
          <h3 className="font-display font-semibold text-sm text-muted-foreground mb-3">All Matches ({MATCHES.length})</h3>
          <div className="space-y-3">
            {MATCHES.map(m => (
              <button
                key={m.id}
                onClick={() => setActiveChat(m.id)}
                className="w-full feed-card p-3.5 flex items-center gap-3 text-left"
              >
                <div className={`relative w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center flex-shrink-0 ${!m.revealed ? "avatar-blurred" : ""}`}>
                  <span className="text-xl">👤</span>
                  {m.unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-crush rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                      {m.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-semibold text-sm">
                      {m.revealed ? m.realName : m.nickname}
                    </p>
                    {m.revealed ? (
                      <Unlock size={12} className="text-match" />
                    ) : (
                      <div className="flex items-center gap-0.5">
                        <Lock size={11} className="text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{m.revealTimer}h</span>
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs truncate">{m.lastMsg}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-muted-foreground text-[10px]">{m.time}</span>
                  <ChevronRight size={14} className="text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
