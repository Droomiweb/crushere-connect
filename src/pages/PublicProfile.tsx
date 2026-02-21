import { useState, useEffect } from "react";
import { 
  X, 
  MapPin, 
  GraduationCap, 
  Heart, 
  MessageCircle, 
  Loader2,
  ChevronLeft,
  Sparkles,
  Check
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (id) fetchPublicProfile();
  }, [id]);

  const fetchPublicProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          college:colleges(name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({ title: "Error", description: "Profile not found", variant: "destructive" });
      navigate("/feed");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const layout = profile?.profile_layout;
  const hasCustomLayout = layout && layout.elements && layout.elements.length > 0;
  const isPremium = profile?.subscription_plan === 'premium';

  // Fallback limits if premium expired
  let renderBackground = { type: 'color', value: '#1a1b26' };
  let renderElements = layout?.elements || [];

  if (layout) {
    if (layout.background?.type === 'color' || isPremium) {
      renderBackground = layout.background;
    }
    if (!isPremium) {
       // Filter elements (max 2 images, reset fonts)
       let imgCount = 0;
       renderElements = renderElements.filter((el: any) => {
         if (el.type === 'image') {
           imgCount++;
           if (imgCount > 2) return false;
         }
         return true;
       }).map((el: any) => {
         if (el.type === 'text' && el.fontFamily !== 'Inter') {
           return { ...el, fontFamily: 'Inter' };
         }
         return el;
       });
    }
  }

  if (hasCustomLayout) {
    return (
      <div className="min-h-screen flex justify-center bg-black">
        <div 
          className="w-full max-w-mobile min-h-[812px] h-screen relative overflow-hidden shadow-2xl"
          style={{
              background: renderBackground?.type === 'color' ? renderBackground.value :
                          renderBackground?.type === 'gradient' ? renderBackground.value :
                          `url(${renderBackground?.value}) center/cover no-repeat`
          }}
        >
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-6 left-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white z-50 hover:bg-black/60 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Render Elements */}
          {renderElements.map((el: any) => (
            <div 
              key={el.id}
              className="absolute overflow-hidden"
              style={{
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                borderRadius: el.borderRadius,
              }}
            >
              {el.type === 'text' && (
                <div style={{ color: el.color, fontSize: el.fontSize, fontFamily: el.fontFamily, whiteSpace: 'pre-wrap', padding: '4px 8px' }}>
                  {el.content}
                </div>
              )}
              
              {el.type === 'image' && (
                <img src={el.content} alt="Element" className="w-full h-full object-cover pointer-events-none" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400?text=Invalid+Image' }} />
              )}

              {el.type === 'link' && (
                <a href={el.linkUrl || '#'} target="_blank" rel="noreferrer" className="bg-primary text-white font-bold px-4 py-3 rounded-xl flex items-center justify-center text-sm w-full h-full hover:brightness-110 active:scale-95 transition-all">
                  {el.content}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // STANDARD PROFILE VIEW
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-mobile min-h-screen flex flex-col bg-background relative overflow-hidden pb-10">
        {/* Banner area */}
        <div className={`h-48 relative ${isPremium ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500' : 'bg-gradient-brand'}`}>
          <button 
            onClick={() => navigate(-1)}
            className="absolute top-6 left-4 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white z-10"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Profile Details */}
        <div className="px-6 -mt-14 relative z-10">
          <div className="flex items-end justify-between mb-4">
            <div className="relative flex-shrink-0">
              <div className={`w-28 h-28 rounded-full p-[2.5px] shadow-2xl ${isPremium ? 'bg-gradient-to-tr from-yellow-400 via-orange-500 to-pink-500 shadow-orange-500/30' : 'bg-gradient-brand shadow-primary/30'}`}>
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} className="w-full h-full object-cover" />
                  ) : "👤"}
                </div>
              </div>
              {isPremium && (
                <div className="absolute top-1 right-1 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center border-2 border-background shadow-md shadow-blue-500/20 z-10" title="Premium Verified">
                  <Check size={16} strokeWidth={4} className="text-white" />
                </div>
              )}
            </div>
            <div className="flex gap-2 mb-2">
               <button className="btn-brand px-6 py-2.5 rounded-2xl text-sm font-bold text-white shadow-glow active:scale-95 transition-transform">
                 Match 💜
               </button>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="font-display font-bold text-3xl mb-1">{profile?.full_name}</h1>
            <p className="text-primary font-medium text-sm mb-4">@{profile?.username}</p>
            
            <div className="flex flex-col gap-2.5">
              {profile?.college?.name && (
                <div className="flex items-center gap-3 text-foreground/80 text-sm bg-white/5 p-3 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <GraduationCap size={16} />
                  </div>
                  <span className="font-medium">{profile.college.name}</span>
                </div>
              )}
              {(profile?.district || profile?.state) && (
                <div className="flex items-center gap-3 text-foreground/80 text-sm bg-white/5 p-3 rounded-2xl border border-white/5">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <MapPin size={16} />
                  </div>
                  <span className="font-medium">{profile.district}, {profile.state}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 p-5 rounded-[2rem] mb-6">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
              <Sparkles size={14} className="text-primary" /> About
            </h3>
            <p className="text-sm leading-relaxed text-foreground/90 font-medium">
              {profile?.bio || "This user prefers to keep the mystery alive. ✨"}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-[2rem] p-5 flex flex-col items-center justify-center gap-2 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Sparkles size={24} className="text-primary" />
              </div>
              <span className="font-display font-black text-2xl">{profile?.points || 0}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Points</span>
            </div>
            <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-[2rem] p-5 flex flex-col items-center justify-center gap-2 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-match/20 flex items-center justify-center">
                <Heart size={24} className="text-match" />
              </div>
              <span className="font-display font-black text-2xl">?</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Matches</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
