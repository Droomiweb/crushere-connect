import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, Share, Users, Music, Settings, Link as LinkIcon, 
  Play, Pause, Volume2, ShieldAlert, Send, Loader2, Clock
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import ReactPlayer from "react-player";

type Room = {
  id: string;
  name: string;
  created_by: string;
  is_private: boolean;
  password?: string;
  current_music_url?: string;
  is_playing: boolean;
};

type Message = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { name: string, avatar_url: string };
};

export default function RoomView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const pwd = searchParams.get('pwd');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  // Presence State
  const [activeUsers, setActiveUsers] = useState<any[]>([]);

  // DJ State
  const [showDJConsole, setShowDJConsole] = useState(false);
  const [musicInput, setMusicInput] = useState("");
  
  // Timer State (10 minutes for free tier)
  const isPremium = profile?.subscription_plan === 'premium';
  const isAdmin = profile?.is_admin === true;
  const isPrivileged = isPremium || isAdmin;
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    if (!id) return;
    initAuthAndRoom();
  }, [id]);

  const initAuthAndRoom = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      setUser(authUser);
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (userProfile) setProfile(userProfile);
      fetchRoom(authUser);
    } else {
      // Still fetch room even if not logged in (to potentially see public rooms or get kicked later)
      fetchRoom(null);
    }
  };

  const fetchRoom = async (currentUser: any) => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        navigate('/rooms');
        return;
      }

      // Security check for private rooms
      if (data.is_private && data.password !== pwd && data.created_by !== currentUser?.id) {
        toast({ title: "Access Denied", description: "Invalid room password", variant: "destructive" });
        navigate('/rooms');
        return;
      }

      setRoom(data);
      setupRealtime(data.id);
      fetchMessages(data.id);
    } catch (error: any) {
      navigate('/rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId: string) => {
    const { data } = await supabase
      .from('room_messages')
      .select('*, profile:profiles(name, avatar_url)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(50);
      
    if (data) setMessages(data as any);
    scrollToBottom();
  };

  const setupRealtime = (roomId: string) => {
    // 1. Listen for room updates (e.g., DJ changes music)
    const roomSub = supabase.channel(`room_${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, payload => {
        setRoom(payload.new as Room);
      })
      .subscribe();

    // 2. Listen for new chat messages
    const chatSub = supabase.channel(`chat_${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `room_id=eq.${roomId}` }, async payload => {
        // Fetch sender profile info
        const { data: profile } = await supabase.from('profiles').select('name, avatar_url').eq('id', payload.new.user_id).single();
        const fullMsg = { ...payload.new, profile } as Message;
        setMessages(prev => [...prev, fullMsg]);
        scrollToBottom();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomSub);
      supabase.removeChannel(chatSub);
    };
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, 100);
  };

  // 10-Minute Kick Logic for Free Users
  useEffect(() => {
    if (loading || !room || isPrivileged) return;

    if (room.is_playing) {
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Evict user
            navigate('/rooms');
            toast({ title: "Time's up! ⏳", description: "Get Premium to stay in music rooms indefinitely.", variant: "destructive" });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [loading, room?.is_playing, isPrivileged]);


  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !id) return;

    const content = newMessage;
    setNewMessage(""); // optimistic clear

    await supabase.from('room_messages').insert([{
      room_id: id,
      user_id: user.id,
      content
    }]);
  };

  const updateDJStatus = async (url: string | null, playing: boolean) => {
    if (!id) return;
    await supabase.from('rooms').update({
      current_music_url: url,
      is_playing: playing
    }).eq('id', id);
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/rooms/${id}${room?.is_private ? `?pwd=${room.password}` : ''}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copied to clipboard!" });
  };

  if (loading || !room) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <AppLayout hideNav>
      <div className="flex flex-col h-full bg-background relative overflow-hidden">
        
        {/* Dynamic Background visualizer if playing */}
        {room.is_playing && (
          <div className="absolute inset-x-0 -top-32 h-[400px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent animate-pulse pointer-events-none z-0 mix-blend-screen" />
        )}

        {/* Header */}
        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between bg-card/50 backdrop-blur-xl z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/rooms')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted active:scale-95 transition-all">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-display font-bold text-lg leading-tight flex items-center gap-2">
                {room.name}
              </h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1"><Users size={10} /> Active</span>
                {room.is_private && <span className="bg-white/10 px-1.5 rounded-sm">Private</span>}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isPrivileged && room.is_playing && (
              <div className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg flex items-center gap-1 border border-amber-500/20">
                <Clock size={12}/> {Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2, '0')}
              </div>
            )}
            <button onClick={copyShareLink} className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all">
              <Share size={18} />
            </button>
          </div>
        </div>

        {/* --- MAIN CHAT AREA --- */}
        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 z-10 space-y-4 scroll-smooth">
          {/* Welcome Message */}
          <div className="text-center my-6">
            <div className="inline-block bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-2xl text-xs font-medium">
              Welcome to the room! Messages are live.
            </div>
          </div>

          {messages.map((msg, i) => {
            const isMe = msg.user_id === user?.id;
            return (
              <div key={msg.id || i} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                 <img 
                   src={msg.profile?.avatar_url || 'https://placehold.co/100'} 
                   className="w-8 h-8 rounded-full border border-border/50 object-cover cursor-pointer"
                   onClick={() => navigate(`/profile/${msg.user_id}`)}
                   alt="Avatar"
                 />
                 <div className={`max-w-[75%] ${isMe ? 'text-right' : 'text-left'}`}>
                    <p className="text-[10px] text-muted-foreground mb-1 ml-1">{msg.profile?.name || 'User'}</p>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted text-foreground rounded-tl-none'}`}>
                      {msg.content}
                    </div>
                 </div>
              </div>
            );
          })}
        </div>

        {/* --- BOTTOM SECTION (DJ & Input) --- */}
        <div className="p-3 bg-card/80 backdrop-blur-xl border-t border-border/50 z-20 shrink-0 mb-6">
          
          {/* DJ Tools Expanded */}
          {showDJConsole && isPrivileged && (
            <div className="mb-3 p-3 bg-black/40 border border-white/5 rounded-2xl animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 mb-2">
                <Music size={14} className="text-primary"/>
                <p className="font-bold text-xs">DJ Console</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"><LinkIcon size={14}/></div>
                  <input
                    type="text"
                    value={musicInput}
                    onChange={e => setMusicInput(e.target.value)}
                    placeholder="Paste YouTube Link..."
                    className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-xs"
                  />
                </div>
                <button 
                  onClick={() => updateDJStatus(musicInput, true)}
                  disabled={!musicInput}
                  className="bg-primary text-white p-2 rounded-xl disabled:opacity-50"
                >
                   <Play size={16} fill="currentColor"/>
                </button>
                <button 
                  onClick={() => updateDJStatus(null, false)}
                  className="bg-destructive/20 text-destructive p-2 rounded-xl"
                >
                   <Pause size={16} fill="currentColor"/>
                </button>
              </div>
            </div>
          )}

          {/* Currently Playing Bar */}
          {room.current_music_url && room.is_playing && (
            <div className="mb-3 px-3 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="relative w-6 h-6 shrink-0 flex items-center justify-evenly">
                   {/* Mini CSS visualizer */}
                   <div className="w-1 bg-primary h-[40%] animate-[bounce_0.8s_ease-in-out_infinite_alternate]" />
                   <div className="w-1 bg-primary h-[80%] animate-[bounce_0.8s_ease-in-out_infinite_alternate_0.2s]" />
                   <div className="w-1 bg-primary h-[60%] animate-[bounce_0.8s_ease-in-out_infinite_alternate_0.4s]" />
                </div>
                <p className="text-xs text-muted-foreground truncate font-medium">Currently playing music via YouTube</p>
              </div>
              
              {/* Invisible React Player to actually handle audio */}
              <div className="hidden">
                 {/* @ts-ignore */}
                 <ReactPlayer 
                   url={room.current_music_url} 
                   playing={room.is_playing} 
                   volume={1} 
                   controls={false}
                   width="0" height="0"
                 />
              </div>
            </div>
          )}

          {/* Chat Input Row */}
          <form onSubmit={sendMessage} className="flex gap-2">
             <input
               type="text"
               value={newMessage}
               onChange={e => setNewMessage(e.target.value)}
               placeholder="Write a message..."
               className="flex-1 crushere-input px-4 py-3 rounded-2xl text-sm"
             />
             
             {isPrivileged && (
               <button 
                 type="button"
                 onClick={() => setShowDJConsole(!showDJConsole)}
                 className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl border transition-all ${showDJConsole ? 'bg-primary/20 border-primary text-primary' : 'bg-muted border-border text-foreground hover:bg-muted/80'}`}
               >
                 <Music size={20} />
               </button>
             )}

             <button 
               type="submit"
               disabled={!newMessage.trim()}
               className="shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-brand text-white disabled:opacity-50"
             >
               <Send size={18} />
             </button>
          </form>

        </div>
      </div>
    </AppLayout>
  );
}
