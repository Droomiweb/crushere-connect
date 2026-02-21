import { useState, useEffect } from "react";
import { 
  X, 
  Image as ImageIcon, 
  Film, 
  BarChart3, 
  Loader2, 
  Plus, 
  Trash2,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const AVAILABLE_TAGS = [
  { label: "General", emoji: "✨", color: "bg-primary/10 text-primary" },
  { label: "Trending", emoji: "📈", color: "bg-primary/10 text-primary" },
  { label: "Hot", emoji: "🔥", color: "bg-orange-500/10 text-orange-500" },
  { label: "Placements", emoji: "🎓", color: "bg-blue-500/10 text-blue-500" },
  { label: "Confessions", emoji: "💌", color: "bg-pink-500/10 text-pink-500" },
  { label: "Study", emoji: "📚", color: "bg-green-500/10 text-green-500" },
  { label: "Events", emoji: "🎉", color: "bg-purple-500/10 text-purple-500" }
];

export default function CreatePost() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState(AVAILABLE_TAGS[0]);

  // Media
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Poll
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
      if (user) {
        supabase.from('profiles').select('subscription_plan, is_admin:admins(id)').eq('id', user.id).single()
          .then(({ data }) => setIsPremium(data?.subscription_plan === 'premium' || !!data?.is_admin));
      }
    });
  }, []);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPremium) {
      toast({ title: "Premium Feature", description: "Get Premium to post photos and videos! ✨", variant: "destructive" });
      return;
    }

    const files = Array.from(e.target.files || []);
    if (files.length + mediaFiles.length > 4) {
      toast({ title: "Limit reached", description: "You can upload up to 4 files." });
      return;
    }

    setMediaFiles([...mediaFiles, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setMediaPreviews([...mediaPreviews, ...newPreviews]);
  };

  const removeMedia = (index: number) => {
    const newFiles = [...mediaFiles];
    newFiles.splice(index, 1);
    setMediaFiles(newFiles);

    const newPreviews = [...mediaPreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setMediaPreviews(newPreviews);
  };

  const handleAddOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = [...pollOptions];
      newOptions.splice(index, 1);
      setPollOptions(newOptions);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && mediaFiles.length === 0 && !showPoll) return;
    if (showPoll && pollOptions.some(opt => !opt.trim())) {
      toast({ title: "Poll Error", description: "Please fill all poll options." });
      return;
    }

    setLoading(true);
    try {
      let mediaUrls: string[] = [];
      if (mediaFiles.length > 0) {
        setUploading(true);
        for (const file of mediaFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${userId}_${Date.now()}_${Math.random()}.${fileExt}`;
          const filePath = `posts/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          
          mediaUrls.push(publicUrl);
        }
        setUploading(false);
      }

      const pollData = showPoll ? {
        options: pollOptions.filter(o => o.trim()),
        votes: pollOptions.reduce((acc, curr) => ({ ...acc, [curr]: 0 }), {})
      } : null;

      const { error } = await supabase
        .from('posts')
        .insert({
          author_id: userId,
          content: content,
          media_urls: mediaUrls,
          poll_data: pollData,
          tag: selectedTag.label,
          tag_color: selectedTag.color
        });

      if (error) throw error;

      toast({ title: "Posted! 🚀", description: "Your post is now live." });
      navigate("/feed");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex justify-center selection:bg-primary/30">
      <div className="w-full max-w-mobile min-h-screen flex flex-col bg-background relative overflow-hidden boarder-x border-white/5">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-primary/10 blur-[100px] animate-pulse" />
          <div className="absolute bottom-[20%] left-[-10%] w-[250px] h-[250px] rounded-full bg-crush/10 blur-[80px] animate-pulse duration-5000" />
        </div>

        {/* Header */}
        <div className="px-4 py-6 flex items-center justify-between sticky top-0 bg-background/40 backdrop-blur-2xl z-50 border-b border-white/5">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
          <div className="text-center">
            <h2 className="font-display font-bold text-xl tracking-tight">New Post</h2>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isPremium ? 'bg-primary' : 'bg-muted-foreground'} animate-pulse`} />
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">
                {isPremium ? "Premium Access ✨" : "Standard Mode"}
              </p>
            </div>
          </div>
          <button 
            disabled={(!content.trim() && mediaFiles.length === 0 && !showPoll) || loading}
            onClick={handlePost}
            className="btn-brand px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest text-white disabled:opacity-30 disabled:grayscale transition-all shadow-glow hover:shadow-primary/30 active:scale-95"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Post"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8 scroll-hidden pb-40 relative z-10">
          {/* Tag Selector */}
          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-4 px-1">Select Category</p>
            <div className="flex gap-2.5 overflow-x-auto scroll-hidden pb-2 -mx-1 px-1">
              {AVAILABLE_TAGS.map((tag) => (
                <button
                  key={tag.label}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all border ${
                    selectedTag.label === tag.label 
                      ? `${tag.color} border-current shadow-[0_0_15px_rgba(var(--primary),0.2)] scale-105 active` 
                      : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                  }`}
                >
                  {tag.emoji} {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="relative group mb-8">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening on campus?"
              className="w-full bg-transparent text-xl font-medium leading-relaxed resize-none focus:outline-none min-h-[160px] placeholder:text-muted-foreground/30 transition-all"
            />
            <div className="absolute -bottom-2 left-0 w-12 h-1 bg-gradient-brand rounded-full opacity-30 group-focus-within:opacity-100 transition-opacity" />
          </div>

          {/* Media Previews */}
          {mediaPreviews.length > 0 && (
            <div className={`grid gap-3 mb-8 ${mediaPreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {mediaPreviews.map((preview, i) => (
                <div key={preview} className="relative aspect-square rounded-[2.5rem] overflow-hidden group border border-white/10 shadow-xl animate-in zoom-in-95 duration-300">
                  <img src={preview} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button 
                    onClick={() => removeMedia(i)}
                    className="absolute top-3 right-3 w-10 h-10 rounded-2xl bg-black/40 text-white flex items-center justify-center backdrop-blur-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:border-destructive active:scale-90"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Poll Area */}
          {showPoll && (
            <div className="p-1 rounded-[2.5rem] bg-gradient-brand mb-8 animate-in slide-in-from-bottom-6 duration-500">
              <div className="bg-background/95 backdrop-blur-xl rounded-[2.4rem] p-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <BarChart3 size={14} /> Interactive Poll
                  </span>
                  <button 
                    onClick={() => setShowPoll(false)} 
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="space-y-3">
                  {pollOptions.map((option, i) => (
                    <div key={i} className="flex gap-2 group">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handlePollOptionChange(i, e.target.value)}
                          placeholder={`Option ${i + 1}`}
                          className="w-full bg-white/5 border border-white/5 px-5 py-4 rounded-2xl text-sm focus:bg-white/10 focus:border-primary/30 outline-none transition-all placeholder:text-muted-foreground/30"
                        />
                        <div className="absolute left-0 bottom-0 w-0 h-[1px] bg-primary transition-all duration-300 group-focus-within:w-full" />
                      </div>
                      {pollOptions.length > 2 && (
                        <button 
                          onClick={() => removePollOption(i)} 
                          className="w-12 h-14 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 4 && (
                    <button 
                      onClick={handleAddOption}
                      className="w-full py-4 rounded-2xl border border-dashed border-white/10 text-xs font-bold text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all flex items-center justify-center gap-2 mt-2"
                    >
                      <Plus size={14} /> Add Option
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="fixed bottom-0 left-0 right-0 max-w-mobile mx-auto p-6 safe-bottom z-50">
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-3 flex items-center justify-around shadow-2xl shadow-black/40">
            {/* 1. Photo Upload */}
            <div className="relative">
              <input 
                type="file" 
                multiple 
                accept="image/*,video/*" 
                onChange={handleMediaSelect} 
                className="hidden" 
                id="media-input" 
              />
              <label 
                htmlFor="media-input"
                className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-all cursor-pointer active:scale-90 hover:scale-110 ${isPremium ? "text-primary hover:bg-primary/10" : "text-muted-foreground/40 cursor-not-allowed"}`}
                onClick={(e) => {
                  if (!isPremium) {
                    e.preventDefault();
                    toast({ title: "Premium Feature", description: "Get Premium to upload images! ✨", variant: "destructive" });
                  }
                }}
              >
                <ImageIcon size={24} />
              </label>
            </div>
            
            {/* 2. Video Upload */}
            <button 
              onClick={() => {
                if (!isPremium) {
                  toast({ title: "Premium Feature", description: "Get Premium to upload videos! 🎥", variant: "destructive" });
                  return;
                }
                document.getElementById('media-input')?.click();
              }}
              className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-all active:scale-90 hover:scale-110 ${isPremium ? "text-primary hover:bg-primary/10" : "text-muted-foreground/40 cursor-not-allowed"}`}
            >
              <Film size={24} />
            </button>

            {/* 3. Polls */}
            <button 
              onClick={() => {
                if (!isPremium) {
                  toast({ title: "Premium Feature", description: "Get Premium to create polls! 📊", variant: "destructive" });
                  return;
                }
                setShowPoll(!showPoll);
              }}
              className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-all active:scale-90 hover:scale-110 ${showPoll ? "bg-gradient-brand text-white shadow-glow scale-110" : (isPremium ? "text-primary hover:bg-primary/10" : "text-muted-foreground/40 cursor-not-allowed")}`}
            >
              <BarChart3 size={24} />
            </button>

          </div>

          {!isPremium && (
            <div className="mt-4 text-center animate-in slide-in-from-bottom-2 duration-500">
              <button 
                onClick={() => navigate("/premium")}
                className="group relative inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-full bg-white/5 border border-white/5 hover:border-primary/30 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-brand opacity-0 group-hover:opacity-5 transition-opacity" />
                <Sparkles size={12} className="text-primary animate-pulse" /> 
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Upgrade for Pro Features</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
