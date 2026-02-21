import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Bell, UserPlus, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    fetchUnreadCount(user.id);

    // Subscribe to real-time notifications
    const channel = supabase
      .channel(`user_notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          handleNewNotification(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchUnreadCount = async (uid: string) => {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", uid)
      .eq("is_read", false);
    
    if (!error && count !== null) {
      setUnreadCount(count);
    }
  };

  const refreshUnreadCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) fetchUnreadCount(user.id);
  };

  const handleNewNotification = (notification: any) => {
    setUnreadCount(prev => prev + 1);

    // Show top popup notification
    toast.custom((t) => (
      <div 
        onClick={() => {
          toast.dismiss(t);
          navigate("/notifications");
        }}
        className="w-full max-w-sm bg-card/95 backdrop-blur-xl border border-white/10 rounded-3xl p-4 flex gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] cursor-pointer animate-in slide-in-from-top-full duration-500"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-glow shadow-primary/20">
          {notification.type === 'college_join' ? <UserPlus size={20} className="text-white" /> : 
           notification.type === 'admin_broadcast' ? <Sparkles size={20} className="text-white" /> : 
           <Bell size={20} className="text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">{notification.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{notification.content}</p>
        </div>
        <div className="flex items-center">
          <ChevronRight size={16} className="text-muted-foreground" />
        </div>
      </div>
    ), {
      position: "top-center",
      duration: 5000,
    });
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
