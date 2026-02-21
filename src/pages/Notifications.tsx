import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, BellOff, CheckCircle2, Clock, Loader2, Sparkles, UserPlus, Info } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

type Notification = {
  id: string;
  type: string;
  title: string;
  content: string;
  data: any;
  is_read: boolean;
  created_at: string;
};

export default function Notifications() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
      
      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast({ title: "All caught up!", description: "All notifications marked as read." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      await markAsRead(n.id);
    }

    if (n.type === 'college_join' && n.data?.joined_user_id) {
      navigate(`/profile/${n.data.joined_user_id}`);
    } else if (n.data?.link) {
      navigate(n.data.link);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'college_join': return <UserPlus className="text-primary" size={20} />;
      case 'admin_broadcast': return <Sparkles className="text-match" size={20} />;
      case 'interaction': return <CheckCircle2 className="text-green-500" size={20} />;
      default: return <Info className="text-muted-foreground" size={20} />;
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <AppLayout onRefresh={fetchNotifications}>
      <div className="px-4 pt-6 ">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-2xl glass-card flex items-center justify-center border border-border"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="font-display font-bold text-2xl">Notifications</h1>
          </div>
          {notifications.some(n => !n.is_read) && (
            <button 
              onClick={markAllAsRead}
              className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="space-y-3 pb-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-xs text-muted-foreground">Catching up with your updates...</p>
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`group relative flex gap-4 p-4 rounded-3xl transition-all duration-300 border cursor-pointer ${
                  n.is_read 
                    ? "bg-card/20 border-white/5 opacity-70" 
                    : "bg-gradient-glass border-white/10 shadow-glow shadow-primary/5 scale-[1.01]"
                }`}
              >
                {!n.is_read && (
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
                
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  n.is_read ? "bg-muted/50" : "bg-primary/20"
                }`}>
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm font-bold truncate ${n.is_read ? "text-muted-foreground" : "text-foreground"}`}>
                      {n.title}
                    </h3>
                  </div>
                  <p className={`text-xs leading-relaxed mb-2 ${n.is_read ? "text-muted-foreground/80" : "text-muted-foreground"}`}>
                    {n.content}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
                    <Clock size={10} />
                    <span>{getRelativeTime(n.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-slide-up">
              <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
                <BellOff size={32} className="text-muted-foreground/40" />
              </div>
              <h2 className="text-lg font-bold mb-2">No notifications yet</h2>
              <p className="text-sm text-muted-foreground max-w-[240px]">
                When there's news or interactions, we'll let you know here!
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
