import { useState } from "react";
import { Users, Clock, Lock, Zap } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";

const ROOMS = [
  {
    id: 1,
    name: "Late Night Coders ☕",
    desc: "Vibe, rubber duck debug, and survive together",
    members: 23,
    maxMembers: 30,
    timeLeft: "2h 14m",
    tags: ["💻 Tech", "☕ Chai"],
    active: true,
    joined: false,
  },
  {
    id: 2,
    name: "Murakami Readers 📖",
    desc: "Discussing 'Norwegian Wood' this week",
    members: 9,
    maxMembers: 15,
    timeLeft: "5h 32m",
    tags: ["📖 Books", "🎭 Art"],
    active: true,
    joined: false,
  },
  {
    id: 3,
    name: "Pre-Placement Anxiety 😅",
    desc: "Mock interviews, tips, and mutual panic",
    members: 47,
    maxMembers: 50,
    timeLeft: "1h 05m",
    tags: ["🎓 Placements", "💼 Career"],
    active: true,
    joined: true,
  },
  {
    id: 4,
    name: "Sunset Jammers 🎸",
    desc: "Share songs, playlists, music recs",
    members: 18,
    maxMembers: 25,
    timeLeft: "3h 50m",
    tags: ["🎸 Music", "✨ Vibes"],
    active: false,
    joined: false,
  },
];

export default function Rooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState(ROOMS);
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomDuration, setRoomDuration] = useState("2");

  const toggleJoin = (id: number) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, joined: !r.joined, members: r.joined ? r.members - 1 : r.members + 1 } : r));
  };

  return (
    <AppLayout>
      <div className="px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="font-display font-bold text-2xl">Micro Rooms 🔮</h1>
            <p className="text-muted-foreground text-xs">Temporary spaces. No trace left behind.</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-brand px-3 py-2 rounded-xl font-display font-semibold text-xs text-white"
          >
            + Create
          </button>
        </div>

        {/* How it works */}
        <div className="glass-card border border-primary/20 rounded-2xl p-3 mb-5 flex gap-2.5 mt-4">
          <Clock size={16} className="text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Rooms auto-delete after the time limit. No logs, no screenshots, no history. <span className="text-foreground font-medium">Your vibe stays here.</span>
          </p>
        </div>

        {/* Create room */}
        {showCreate && (
          <div className="profile-card p-4 rounded-2xl mb-5 animate-slide-up">
            <h3 className="font-display font-semibold mb-3">Create a Room</h3>
            <input
              type="text"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              placeholder="Room name (e.g. Chai & Chill ☕)"
              className="crushere-input w-full px-4 py-3 rounded-xl text-sm mb-3"
            />
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-2">Duration</p>
              <div className="flex gap-2">
                {["1", "2", "4", "6"].map(d => (
                  <button
                    key={d}
                    onClick={() => setRoomDuration(d)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${roomDuration === d ? "bg-gradient-brand text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    {d}h
                  </button>
                ))}
              </div>
            </div>
            <button
              disabled={!roomName.trim()}
              className="btn-brand w-full py-3 rounded-xl font-display font-semibold text-sm text-white disabled:opacity-40"
              onClick={() => { setShowCreate(false); setRoomName(""); }}
            >
              Create Room 🔮
            </button>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto scroll-hidden pb-1">
          {["🔥 Active", "🎸 Music", "📚 Study", "🎮 Gaming", "💬 Chat"].map((t, i) => (
            <button key={t} className={`pill-tag whitespace-nowrap flex-shrink-0 ${i === 0 ? "active" : ""}`}>{t}</button>
          ))}
        </div>

        {/* Rooms list */}
        <div className="space-y-4 pb-6">
          {rooms.map((room, idx) => (
            <div
              key={room.id}
              className="room-card p-4 animate-slide-up"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-display font-semibold text-sm">{room.name}</h3>
                    {room.joined && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">Joined</span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">{room.desc}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {room.tags.map(t => (
                  <span key={t} className="pill-tag text-[10px]">{t}</span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users size={12} />
                    <span>{room.members}/{room.maxMembers}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span>{room.timeLeft} left</span>
                  </div>
                </div>
                {/* Progress */}
                <div className="flex-1 mx-3 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-brand rounded-full"
                    style={{ width: `${(room.members / room.maxMembers) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => toggleJoin(room.id)}
                  className={`px-4 py-2 rounded-xl font-display font-semibold text-xs transition-all active:scale-95 ${
                    room.joined
                      ? "bg-muted text-muted-foreground"
                      : "bg-gradient-brand text-white shadow-glow"
                  }`}
                >
                  {room.joined ? "Leave" : "Join →"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
