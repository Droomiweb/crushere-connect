import { useState, useEffect } from "react";
import { Calendar, MapPin, Users, ChevronRight, Star, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type Event = {
  id: string; // UUID from DB
  title: string;
  subtitle: string;
  date: string;
  time: string;
  location: string;
  attendees_count: number;
  max_attendees: number;
  tags: string[];
  type: 'online' | 'offline';
  featured: boolean;
  registered?: boolean; // Local state only for now
};

export default function Events() {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      if (data) {
        setEvents(data.map(e => ({ ...e, registered: false })));
      }
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error fetching events",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggle = async (id: string) => {
    // Optimistic update
    const eventIndex = events.findIndex(e => e.id === id);
    if (eventIndex === -1) return;

    const event = events[eventIndex];
    const isRegistering = !event.registered;
    const newCount = isRegistering ? event.attendees_count + 1 : Math.max(0, event.attendees_count - 1);

    const newEvents = [...events];
    newEvents[eventIndex] = {
      ...event,
      registered: isRegistering,
      attendees_count: newCount
    };
    setEvents(newEvents);

    // DB Update
    try {
      const { error } = await supabase
        .from('events')
        .update({ attendees_count: newCount })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: isRegistering ? "Registered!" : "Unregistered",
        description: isRegistering ? "You're on the list." : "You've been removed from the list.",
      });

    } catch (error: any) {
      // Revert optimistic update on error
      newEvents[eventIndex] = event; // old event state
      setEvents([...newEvents]);
      
      toast({
        title: "Error updating registration",
        description: error.message,
        variant: "destructive",
      });
    }
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

        {loading ? (
             <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-muted-foreground" />
             </div>
        ) : (
            <>
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
                        <span className="flex items-center gap-1"><Users size={12} />{featured.attendees_count}/{featured.max_attendees} going</span>
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
                        <span className="flex items-center gap-1"><Users size={11} />{event.attendees_count} going</span>
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
            </>
        )}
      </div>
    </AppLayout>
  );
}
