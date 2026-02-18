import { useState } from "react";
import { Calendar, MapPin, Users, ChevronRight, Star } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const EVENTS = [
  {
    id: 1,
    title: "Anonymous Mixer Night 🎭",
    subtitle: "Meet your campus match IRL — identity reveals at midnight!",
    date: "Sat, Feb 22",
    time: "7:00 PM",
    location: "MIT Manipal Campus, Amphitheatre",
    attendees: 84,
    maxAttendees: 100,
    tags: ["🎭 Social", "✨ Mixer"],
    type: "online",
    featured: true,
    registered: false,
  },
  {
    id: 2,
    title: "Chai & Code Hackathon ☕💻",
    subtitle: "24hr build-fest. Find your team and build something cool.",
    date: "Sun, Feb 23",
    time: "9:00 AM",
    location: "CS Block, Room 301",
    attendees: 62,
    maxAttendees: 80,
    tags: ["💻 Tech", "🏆 Hackathon"],
    type: "offline",
    featured: false,
    registered: true,
  },
  {
    id: 3,
    title: "Night Photography Walk 📸",
    subtitle: "Campus after dark is beautiful. Bring your phone.",
    date: "Fri, Feb 28",
    time: "8:30 PM",
    location: "Library → MIT Lake",
    attendees: 31,
    maxAttendees: 40,
    tags: ["📸 Photography", "🌿 Nature"],
    type: "offline",
    featured: false,
    registered: false,
  },
  {
    id: 4,
    title: "Open Mic Night 🎤",
    subtitle: "Sing, perform, or just vibe. All welcome.",
    date: "Sat, Mar 1",
    time: "6:00 PM",
    location: "Open Air Theatre",
    attendees: 120,
    maxAttendees: 200,
    tags: ["🎤 Music", "🎭 Performance"],
    type: "offline",
    featured: false,
    registered: false,
  },
];

export default function Events() {
  const [events, setEvents] = useState(EVENTS);

  const toggle = (id: number) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, registered: !e.registered, attendees: e.registered ? e.attendees - 1 : e.attendees + 1 } : e));
  };

  const featured = events.find(e => e.featured);
  const rest = events.filter(e => !e.featured);

  return (
    <AppLayout>
      <div className="px-4 pt-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="font-display font-bold text-2xl">Events 🎉</h1>
          <p className="text-muted-foreground text-xs">On your campus & nearby</p>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-5 overflow-x-auto scroll-hidden pb-1">
          {["🔥 All", "📅 This Week", "🎭 Social", "💻 Tech", "🎵 Music", "🏃 Sports"].map((t, i) => (
            <button key={t} className={`pill-tag whitespace-nowrap flex-shrink-0 ${i === 0 ? "active" : ""}`}>{t}</button>
          ))}
        </div>

        {/* Featured event */}
        {featured && (
          <div className="relative profile-card rounded-3xl overflow-hidden mb-5 p-5">
            <div className="absolute inset-0 bg-gradient-brand opacity-15" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Star size={14} className="text-match fill-match" />
                <span className="text-xs text-match font-bold uppercase tracking-wider">Featured</span>
              </div>
              <h2 className="font-display font-bold text-xl mb-1">{featured.title}</h2>
              <p className="text-muted-foreground text-sm mb-4">{featured.subtitle}</p>
              <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar size={12} />{featured.date} • {featured.time}</span>
                <span className="flex items-center gap-1"><MapPin size={12} />{featured.location}</span>
                <span className="flex items-center gap-1"><Users size={12} />{featured.attendees}/{featured.maxAttendees} going</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {featured.tags.map(t => (
                  <span key={t} className="pill-tag text-[10px]">{t}</span>
                ))}
              </div>
              <button
                onClick={() => toggle(featured.id)}
                className={`w-full py-3.5 rounded-2xl font-display font-bold text-sm transition-all ${featured.registered ? "bg-muted text-muted-foreground" : "btn-brand text-white"}`}
              >
                {featured.registered ? "✓ You're Going!" : "Register Now →"}
              </button>
            </div>
          </div>
        )}

        {/* Events list */}
        <div className="space-y-3 pb-6">
          {rest.map((event, idx) => (
            <div
              key={event.id}
              className="feed-card p-4 animate-slide-up"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-display font-semibold text-sm flex-1">{event.title}</h3>
                {event.registered && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium flex-shrink-0">Going ✓</span>
                )}
              </div>
              <p className="text-muted-foreground text-xs mb-3">{event.subtitle}</p>
              <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar size={11} />{event.date}</span>
                <span className="flex items-center gap-1"><MapPin size={11} />{event.location.split(",")[0]}</span>
                <span className="flex items-center gap-1"><Users size={11} />{event.attendees} going</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-1 flex-1">
                  {event.tags.map(t => (
                    <span key={t} className="pill-tag text-[10px]">{t}</span>
                  ))}
                </div>
                <button
                  onClick={() => toggle(event.id)}
                  className={`px-4 py-2 rounded-xl font-display font-semibold text-xs transition-all active:scale-95 ${
                    event.registered ? "bg-muted text-muted-foreground" : "bg-gradient-brand text-white shadow-glow"
                  }`}
                >
                  {event.registered ? "Going ✓" : "Join"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
