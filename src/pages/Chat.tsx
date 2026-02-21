import { useState, useEffect } from "react";
import { MessageCircle, Sparkles, Lock, Unlock, ChevronRight, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type Match = {
  id: string;
  nickname: string;
  dept: string;
  reveal_timer_hours: number;
  last_msg: string;
  last_msg_time: string;
  unread_count: number;
  revealed: boolean;
  real_name: string | null;
  avatar_url?: string;
  other_user_id: string;
};

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  media_url?: string;
  media_type?: string;
};

// Hardcoded messages for now as we don't have a messages table yet for the detailed view
const MESSAGES = [
  { id: 1, from: "them", text: "Hey! Can't believe we matched 😊", time: "2:30 PM" },
  { id: 2, from: "me", text: "I know right! I've seen you at the library so many times haha", time: "2:31 PM" },
  { id: 3, from: "them", text: "Same! I always wondered who the person buried in textbooks was 😄", time: "2:32 PM" },
  { id: 4, from: "me", text: "Guilty as charged 📚 Should we grab chai sometime?", time: "2:34 PM" },
];

export default function Chat() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [almostMatches, setAlmostMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showGifts, setShowGifts] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const GIFTS = [
    { id: 'rose', name: 'Rose', emoji: '🌹', price: 0 },
    { id: 'coffee', name: 'Coffee', emoji: '☕', price: 0 },
    { id: 'heart', name: 'Heart', emoji: '❤️', price: 0 },
    { id: 'sparkles', name: 'Sparkles', emoji: '✨', price: 0 },
  ];

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
      if (user) {
        supabase.from('profiles').select('subscription_plan, is_admin:admins(id)').eq('id', user.id).single()
          .then(({ data }) => setIsPremium(data?.subscription_plan === 'premium' || !!data?.is_admin));
      }
    });

    fetchMatches();
    fetchAlmostMatches();
    
    const channel = supabase
      .channel('chat_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crushes' }, () => {
        fetchMatches();
        fetchAlmostMatches();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new as Message;
        // If message is for the active chat, add it
        if (activeChat) {
          const chat = matches.find(m => m.id === activeChat);
          if (chat && (newMessage.sender_id === chat.other_user_id || newMessage.receiver_id === chat.other_user_id)) {
            setMessages(prev => [...prev, newMessage]);
          }
        }
        fetchMatches(); // Update last message in list
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat, matches]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages();
    }
  }, [activeChat]);

  const fetchMessages = async () => {
    const chat = matches.find(m => m.id === activeChat);
    if (!chat || !userId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${chat.other_user_id}),and(sender_id.eq.${chat.other_user_id},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (type: 'text' | 'image' | 'gift' = 'text', content?: string, mediaUrl?: string) => {
    const chat = matches.find(m => m.id === activeChat);
    if (!chat || !userId || (!msg.trim() && !content && !mediaUrl)) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          receiver_id: chat.other_user_id,
          content: content || (type === 'text' ? msg : null),
          media_url: mediaUrl,
          media_type: type === 'text' ? null : type
        });

      if (error) throw error;
      setMsg("");
      setShowGifts(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `chat/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('avatars') // Reusing avatars bucket or create chat-media
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await handleSendMessage('image', 'Sent an image', publicUrl);
    } catch (error: any) {
      toast({ title: "Upload Error", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };
  const fetchAlmostMatches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('crushes')
        .select(`
          id,
          sender:sender_id (id, full_name, username, avatar_url)
        `)
        .eq('receiver_id', user.id)
        .eq('is_mutual', false)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      setAlmostMatches(data || []);
    } catch (error: any) {
      console.error('Error fetching almost matches:', error);
    }
  };

  const fetchMatches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('crushes')
        .select(`
          id,
          receiver:receiver_id (id, full_name, username, avatar_url),
          sender:sender_id (id, full_name, username, avatar_url),
          expires_at,
          is_mutual
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('is_mutual', true);

      if (error) throw error;

      if (data) {
        const formatted: Match[] = data.map((c: any) => {
          const other = c.sender.id === user.id ? c.receiver : c.sender;
          return {
            id: c.id,
            nickname: other.username,
            real_name: other.full_name,
            avatar_url: other.avatar_url,
            dept: "Unknown",
            reveal_timer_hours: Math.max(0, Math.floor((new Date(c.expires_at).getTime() - Date.now()) / 3600000)),
            last_msg: "Say hello!",
            last_msg_time: "Now",
            unread_count: 0,
            revealed: false,
            other_user_id: other.id
          };
        });
        setMatches(formatted);
      }
    } catch (error: any) {
      console.error('Error fetching matches:', error);
      toast({
        title: "Error fetching matches",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const chatMatch = matches.find(m => m.id === activeChat);

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
            <div className={`w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center relative overflow-hidden ${!chatMatch.revealed ? "avatar-blurred" : ""}`}>
               {chatMatch.avatar_url ? (
                 <img src={chatMatch.avatar_url} className="w-full h-full object-cover" />
               ) : (
                 <span className="text-lg">👤</span>
               )}
            </div>
            <div className="flex-1">
              <p className="font-display font-semibold text-sm">
                {chatMatch.revealed ? chatMatch.real_name : chatMatch.nickname}
              </p>
              <p className="text-muted-foreground text-xs">
                {chatMatch.revealed ? "Identity revealed ✨" : `Identity reveals in ${chatMatch.reveal_timer_hours}h`}
              </p>
            </div>
            {!chatMatch.revealed && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-match/15 border border-match/20">
                <Lock size={12} className="text-match" />
                <span className="text-xs text-match font-medium">{chatMatch.reveal_timer_hours}h</span>
              </div>
            )}
          </div>

          {/* Identity reveal prompt */}
          {!chatMatch.revealed && (
            <div className="mx-4 mt-3 glass-card border border-match/20 rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-match" />
                <p className="text-xs text-muted-foreground flex-1">
                  Identity reveals in <span className="text-match font-medium">{chatMatch.reveal_timer_hours} hours</span>
                </p>
                <button onClick={() => navigate("/premium")} className="text-xs text-match font-bold">
                  Reveal faster →
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto scroll-hidden px-4 py-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-muted-foreground text-xs italic">No messages yet. Say hello! 👋</p>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`flex ${m.sender_id === userId ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.sender_id === userId
                      ? "bg-gradient-brand text-white rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  } ${m.media_type === 'gift' ? "text-3xl text-center bg-transparent border-none px-2 py-2 shadow-none" : ""} ${m.media_type === 'image' ? "p-1 overflow-hidden" : ""}`}>
                    {m.media_type === 'image' && m.media_url && (
                        <div className="mb-1 rounded-xl overflow-hidden bg-black/5">
                            <img src={m.media_url} className="w-full h-auto max-h-60 object-cover" />
                        </div>
                    )}
                    {m.media_type === 'image' ? null : m.content}
                    {m.media_type !== 'gift' && (
                       <p className={`text-[10px] mt-1 ${m.sender_id === userId ? "text-white/60" : "text-muted-foreground"}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Gifts Overlay */}
          {showGifts && (
            <div className="mx-4 mb-3 p-3 glass-card border border-primary/20 rounded-2xl animate-in slide-in-from-bottom-5">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold uppercase tracking-wider opacity-60">Send a Gift</span>
                <button onClick={() => setShowGifts(false)} className="text-muted-foreground">×</button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {GIFTS.map(g => (
                  <button
                    key={g.id}
                    onClick={() => handleSendMessage('gift', g.emoji)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-primary/10 transition-colors"
                  >
                    <span className="text-2xl">{g.emoji}</span>
                    <span className="text-[10px] font-medium">{g.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 safe-bottom glass-card border-t border-border flex gap-2 items-end">
            <button 
              onClick={() => setShowGifts(!showGifts)}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0"
            >
              <Sparkles size={18} className={showGifts ? "text-primary" : ""} />
            </button>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="msg-image"
                disabled={uploading}
              />
              <label 
                htmlFor="msg-image"
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground cursor-pointer"
              >
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
              </label>
            </div>
            <input
              type="text"
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder="Type a message..."
              className="crushere-input flex-1 px-4 py-3 rounded-2xl text-sm"
              onKeyDown={e => e.key === "Enter" && handleSendMessage()}
            />
            <button
              disabled={!msg.trim() || sending || uploading}
              className="btn-brand w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40"
              onClick={() => handleSendMessage()}
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : "→"}
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout onRefresh={async () => {
      await fetchMatches();
      await fetchAlmostMatches();
    }}>
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
              You and <span className="text-foreground font-medium">{matches[0]?.nickname || "someone"}</span> both crushed on each other
            </p>
            {matches.length > 0 && (
                <button
                onClick={() => setActiveChat(matches[0].id)}
                className="btn-brand px-6 py-2.5 rounded-xl font-display font-semibold text-sm text-white"
                >
                Start Chatting →
                </button>
            )}
          </div>
        </div>

        {/* Almost Matches - Premium */}
        {almostMatches.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-sm">Almost Matches</h3>
              <span className="premium-badge px-2 py-0.5 rounded-full text-match-foreground bg-gradient-match">Premium</span>
            </div>
            <div className="space-y-3">
              {almostMatches.map((am) => (
                <div key={am.id} className="glass-card border border-match/20 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-2xl bg-muted relative overflow-hidden ${!isPremium ? "avatar-blurred" : ""}`}>
                      {am.sender.avatar_url ? (
                        <img src={am.sender.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-brand opacity-50">
                          <span className="text-xl">👤</span>
                        </div>
                      )}
                      {!isPremium && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lock size={16} className="text-white/70" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-display font-semibold text-sm">
                        {isPremium ? am.sender.full_name : "Someone"} crushed on you 💜
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {isPremium ? `@${am.sender.username} is waiting for your crush!` : "They haven't matched yet — but they're interested!"}
                      </p>
                    </div>
                  </div>
                  {!isPremium && (
                    <button
                      onClick={() => navigate("/premium")}
                      className="btn-match w-full py-2.5 rounded-xl font-display font-semibold text-sm text-match-foreground flex items-center justify-center gap-2"
                    >
                      <Unlock size={14} />
                      Unlock for ₹49/month
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matches list */}
        <div>
          <h3 className="font-display font-semibold text-sm text-muted-foreground mb-3">All Matches ({matches.length})</h3>
          <div className="space-y-3">
            {loading ? (
                <div className="flex justify-center py-5">
                    <Loader2 className="animate-spin text-muted-foreground" />
                </div>
            ) : (
              matches.map(m => (
                <button
                    key={m.id}
                    onClick={() => setActiveChat(m.id)}
                    className="w-full feed-card p-3.5 flex items-center gap-3 text-left"
                >
                    <div className={`relative w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center flex-shrink-0 overflow-hidden ${!m.revealed ? "avatar-blurred" : ""}`}>
                      {m.avatar_url ? (
                        <img src={m.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">👤</span>
                      )}
                      {m.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-crush rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                          {m.unread_count}
                          </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-display font-semibold text-sm">
                        {m.revealed ? m.real_name : `@${m.nickname}`}
                        </p>
                        {m.revealed ? (
                        <Unlock size={12} className="text-match" />
                        ) : (
                        <div className="flex items-center gap-0.5">
                            <Lock size={11} className="text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">{m.reveal_timer_hours}h</span>
                        </div>
                        )}
                    </div>
                    <p className="text-muted-foreground text-xs truncate">{m.last_msg}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                    <span className="text-muted-foreground text-[10px]">{m.last_msg_time}</span>
                    <ChevronRight size={14} className="text-muted-foreground" />
                    </div>
                </button>
                ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
