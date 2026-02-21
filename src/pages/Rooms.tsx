import { useState, useEffect } from "react";
import { Users, Clock, Loader2, Lock, Music, Headphones, Home } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type Room = {
  id: string;
  name: string;
  created_by: string;
  is_private: boolean;
  is_playing: boolean;
  created_at: string;
};

export default function Rooms() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Create Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);

  // Join Password Modal State
  const [joinRoomId, setJoinRoomId] = useState<string | null>(null);
  const [joinPassword, setJoinPassword] = useState("");

  useEffect(() => {
    initAuthAndRooms();
    
    // Subscribe to new rooms and playing status changes
    const channel = supabase.channel('public_rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, payload => {
        fetchRooms();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const initAuthAndRooms = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUser(user);
    fetchRooms();
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setRooms(data);
    } catch (error: any) {
      console.error('Error fetching rooms:', error);
      toast({ title: "Error fetching rooms", description: error.message, variant: "destructive", });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim() || !user) return;
    setCreating(true);

    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert([{
          name: roomName,
          created_by: user.id,
          is_private: isPrivate,
          password: isPrivate ? password : null
        }])
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Room created! 🔮", });
      setRoomName("");
      setIsPrivate(false);
      setPassword("");
      setShowCreate(false);
      
      // Auto-join room
      navigate(`/rooms/${data.id}`);

    } catch (error: any) {
      toast({ title: "Error creating room", description: error.message, variant: "destructive", });
    } finally {
        setCreating(false);
    }
  };

  const handleJoinClick = (room: Room) => {
    if (room.is_private) {
      setJoinRoomId(room.id);
      setJoinPassword("");
    } else {
      navigate(`/rooms/${room.id}`);
    }
  };

  const submitPasswordJoin = async () => {
    if (!joinRoomId) return;
    
    try {
      // Verify password
      const { data, error } = await supabase
        .from('rooms')
        .select('password')
        .eq('id', joinRoomId)
        .single();

      if (error) throw error;
      
      if (data.password === joinPassword) {
        navigate(`/rooms/${joinRoomId}?pwd=${joinPassword}`);
      } else {
        toast({ title: "Incorrect Password", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error joining room", description: error.message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display font-bold text-2xl">Vibe Rooms 🔮</h1>
            <p className="text-muted-foreground text-xs">Public & Private hangout spaces.</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-brand px-3 py-2 rounded-xl font-display font-semibold text-xs text-white"
          >
            + Create
          </button>
        </div>

        {/* Create room modal/dropdown */}
        {showCreate && (
          <div className="profile-card p-4 rounded-2xl mb-5 animate-slide-up border border-border/50 shadow-2xl">
            <h3 className="font-display font-semibold mb-3">Create a Room</h3>
            <input
              type="text"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              placeholder="Room name (e.g. Lofi Study 📚)"
              className="crushere-input w-full px-4 py-3 rounded-xl text-sm mb-3 bg-background"
            />
            
            <div className="flex items-center gap-3 mb-3 p-3 bg-background rounded-xl">
              <input 
                type="checkbox" 
                id="isPrivate" 
                checked={isPrivate} 
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 accent-primary" 
              />
              <label htmlFor="isPrivate" className="text-sm flex-1 font-medium">Private Room</label>
              <Lock size={16} className={isPrivate ? "text-primary" : "text-muted-foreground"} />
            </div>

            {isPrivate && (
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Set room password"
                className="crushere-input w-full px-4 py-3 rounded-xl text-sm mb-4 bg-background"
              />
            )}

            <button
              disabled={!roomName.trim() || (isPrivate && !password.trim()) || creating}
              className="btn-brand w-full py-3 rounded-xl font-display font-semibold text-sm text-white disabled:opacity-40 flex items-center justify-center gap-2"
              onClick={handleCreateRoom}
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Home size={16} />}
              Open Room
            </button>
          </div>
        )}

        {/* Rooms list */}
        <div className="space-y-4 pb-6">
          {loading ? (
             <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-primary" />
             </div>
          ) : rooms.length === 0 ? (
             <div className="text-center py-10 text-muted-foreground">
               <Music size={48} className="mx-auto mb-4 opacity-20" />
               <p>No active rooms. Be the first to start the party!</p>
             </div>
          ) : (
            rooms.map((room, idx) => (
              <div
                key={room.id}
                className="room-card p-4 animate-slide-up relative bg-card/60 backdrop-blur-md rounded-2xl border border-border/30 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] overflow-hidden"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Visualizer glow efffect if playing music */}
                {room.is_playing && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent animate-pulse pointer-events-none" />
                )}

                <div className="flex items-start justify-between gap-2 relative z-10">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-semibold text-lg">{room.name}</h3>
                      {room.is_private && <Lock size={12} className="text-muted-foreground" />}
                      {room.is_playing && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-500 font-medium flex items-center gap-1">
                           <Headphones size={10} /> Playing Music
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleJoinClick(room)}
                    className="px-5 py-2 rounded-xl font-display font-semibold text-xs transition-all active:scale-95 bg-gradient-brand text-white shadow-glow flex items-center shrink-0"
                  >
                   Enter →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Password Modal */}
      {joinRoomId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-[320px] rounded-3xl p-6 border border-border shadow-2xl">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Lock className="text-primary" />
              </div>
            </div>
            <h3 className="font-display font-bold text-lg text-center mb-1">Private Room</h3>
            <p className="text-xs text-muted-foreground text-center mb-5">Enter password to join.</p>
            
            <input
              type="text"
              value={joinPassword}
              onChange={e => setJoinPassword(e.target.value)}
              placeholder="Password..."
              className="crushere-input w-full px-4 py-3 rounded-xl text-sm mb-4 bg-background text-center tracking-widest font-mono"
              autoFocus
            />
            
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setJoinRoomId(null)} className="py-3 rounded-xl text-sm font-semibold bg-muted hover:bg-muted/80">Cancel</button>
              <button 
                onClick={submitPasswordJoin} 
                disabled={!joinPassword}
                className="py-3 rounded-xl text-sm font-semibold bg-primary text-white shadow-glow disabled:opacity-50"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
