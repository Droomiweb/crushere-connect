import { useState, useEffect } from "react";
import { Sparkles, Heart, X, MessageCircle, MapPin, Loader2, Search } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function Matchmaker() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [suggestion, setSuggestion] = useState<any>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchProfileAndSuggestion();
  }, []);

  const fetchProfileAndSuggestion = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*, is_admin:admins(id)")
          .eq("id", user.id)
          .single();
        if (profile) {
          profile.is_admin = !!profile.is_admin;
        }
        setCurrentUser(profile);
        await getNewSuggestion(profile);
      }
    } catch (error: any) {
      console.error("Error init matchmaker:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNewSuggestion = async (profile: any) => {
    setFetching(true);
    try {
      // Logic for random suggestion based on mode
      let query = supabase.from("profiles").select("*").neq("id", profile.id);
      
      if (profile.mode === "college" && profile.college_id) {
        query = query.eq("college_id", profile.college_id);
      }

      const { data } = await query.limit(20);
      
      if (data && data.length > 0) {
        const random = data[Math.floor(Math.random() * data.length)];
        setSuggestion(random);
      } else {
        setSuggestion(null);
      }
    } catch (error) {
      console.error("Error fetching suggestion:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleCrush = async () => {
    if (!suggestion || !currentUser) return;
    
    // 1. Quota Check
    const quota = (currentUser.subscription_plan === "premium" || currentUser.is_admin) ? 5 : 2;
    const lastCrushDate = currentUser.last_crush_at ? new Date(currentUser.last_crush_at).toDateString() : null;
    const today = new Date().toDateString();
    
    let currentCount = currentUser.daily_crush_count || 0;
    if (lastCrushDate !== today) {
      currentCount = 0;
    }

    if (currentCount >= quota) {
      toast({
        title: "Quota Reached",
        description: `You've used your ${quota} daily crushes. Get Premium for more!`,
        variant: "destructive",
      });
      return;
    }

    setFetching(true);
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // 2. Check for Reciprocal Crush (Receiver -> Sender)
      const { data: reciprocal } = await supabase
        .from("crushes")
        .select("id")
        .eq("sender_id", suggestion.id)
        .eq("receiver_id", currentUser.id)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      const isMutual = !!reciprocal;

      // 3. Insert/Upsert Crush
      const { error: crushError } = await supabase
        .from("crushes")
        .upsert({
          sender_id: currentUser.id,
          receiver_id: suggestion.id,
          expires_at: expiresAt.toISOString(),
          is_mutual: isMutual
        });

      if (crushError) throw crushError;

      // 4. Update Reciprocal Crush as Mutual
      if (isMutual) {
        await supabase
          .from("crushes")
          .update({ is_mutual: true })
          .eq("id", reciprocal.id);
        
        toast({
          title: "IT'S A MATCH! 🎉",
          description: `You and ${suggestion.full_name} matched! Check your chats.`,
        });
      } else {
        toast({
          title: "Crush Sent! 💜",
          description: "If they crush back within 24h, you'll match!",
        });
      }

      // 5. Update Profile Quota
      await supabase
        .from("profiles")
        .update({
          daily_crush_count: currentCount + 1,
          last_crush_at: new Date().toISOString()
        })
        .eq("id", currentUser.id);

      // Refresh state
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();
      setCurrentUser(updatedProfile);
      
      await getNewSuggestion(currentUser);
    } catch (error: any) {
      console.error("Match error:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setFetching(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 pt-6 flex flex-col min-h-[calc(100vh-80px)]">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="font-display font-bold text-2xl">Matchmaker</h1>
            <p className="text-muted-foreground text-xs">
              {currentUser?.mode === "college" ? "Suggestions from your campus" : "Global suggestions"}
            </p>
          </div>
          <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-xl text-xs font-bold border border-primary/20">
            {currentUser ? ((currentUser.subscription_plan === "premium" || currentUser.is_admin) ? 5 : 2) - (currentUser.last_crush_at && new Date(currentUser.last_crush_at).toDateString() === new Date().toDateString() ? currentUser.daily_crush_count || 0 : 0) : 0} / {(currentUser?.subscription_plan === "premium" || currentUser?.is_admin) ? 5 : 2} Left
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center pb-20">
          {loading || fetching ? (
            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
              <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center relative">
                <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-3xl animate-spin" />
                <Sparkles size={32} className="text-primary animate-pulse" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Finding your vibe...</p>
            </div>
          ) : suggestion ? (
            <div className="animate-in slide-in-from-bottom-8 fade-in duration-500">
              <div className="profile-card p-6 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 flex flex-col gap-2">
                   <div className="bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold border border-white/10 uppercase tracking-widest">
                     {suggestion.mode}
                   </div>
                </div>

                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-brand flex items-center justify-center text-4xl shadow-glow transition-transform group-hover:scale-105">
                      {suggestion.avatar_url ? <img src={suggestion.avatar_url} className="w-full h-full object-cover rounded-[2.5rem]" /> : "👤"}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-match shadow-lg flex items-center justify-center border-2 border-background">
                      <Heart size={20} className="text-white fill-white" />
                    </div>
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h2 className="font-display font-bold text-3xl mb-1">{suggestion.full_name}</h2>
                  <p className="text-muted-foreground text-sm flex items-center justify-center gap-1 mb-4">
                    <MapPin size={14} /> {suggestion.place || "Somewhere nearby"}
                  </p>
                  <p className="text-foreground/80 text-sm italic line-clamp-2 px-4 italic opacity-80">
                    "{suggestion.bio || "No bio yet, but I'm probably amazing!"}"
                  </p>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => getNewSuggestion(currentUser)}
                    className="flex-1 h-16 rounded-2xl bg-muted/30 border border-border flex items-center justify-center hover:bg-muted/50 transition-all active:scale-95 transition-all"
                  >
                    <X size={28} className="text-muted-foreground" />
                  </button>
                  <button 
                    onClick={handleCrush}
                    className="flex-[2] h-16 rounded-2xl bg-gradient-brand shadow-glow flex items-center justify-center gap-2 hover:shadow-glow-lg transition-all active:scale-95 text-white font-display font-bold text-lg"
                  >
                    <Sparkles size={24} />
                    Send Crush
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-10 bg-muted/10 rounded-[2.5rem] border border-dashed border-border">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                <Search size={24} className="text-muted-foreground" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Nobody new nearby</h3>
              <p className="text-muted-foreground text-sm mb-6">Change your mode or try again later!</p>
              <button 
                onClick={() => fetchProfileAndSuggestion()}
                className="btn-brand px-6 py-2.5 rounded-xl font-display font-semibold text-sm text-white"
              >
                Refresh Suggestions
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
