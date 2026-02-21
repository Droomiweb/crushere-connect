import { useState, useEffect, useCallback } from "react";
import { Bell, Loader2, Plus, Flame, Snowflake, MessageCircle } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/components/NotificationProvider";
import { User } from "lucide-react";
import { TrendingUp } from "lucide-react";
import CommentSheet from "@/components/CommentSheet";

type Post = {
  id: string;
  author_id: string;
  content: string;
  media_urls: string[];
  poll_data: any;
  likes_count: number;
  dislikes_count: number;
  comments_count: number;
  tag: string;
  tag_color: string;
  created_at: string;
  time: string;
  author?: {
    full_name: string;
    avatar_url: string;
    username: string;
  };
};

function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

// Per-post like/dislike animation state
function useInteractionState(postId: string) {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [dislikeAnim, setDislikeAnim] = useState(false);
  return { liked, setLiked, disliked, setDisliked, likeAnim, setLikeAnim, dislikeAnim, setDislikeAnim };
}

// Post card subcomponent to manage its own animation state
function PostCard({
  post,
  userCollege,
  userId,
  userInteractions,
  onInteract,
  onOpenComments,
  navigate,
  idx,
}: {
  post: Post;
  userCollege: string;
  userId: string | null;
  userInteractions: Record<string, 'like' | 'dislike'>;
  onInteract: (postId: string, type: 'like' | 'dislike') => void;
  onOpenComments: (postId: string) => void;
  navigate: (path: string) => void;
  idx: number;
}) {
  const myInteraction = userInteractions[post.id];
  const [likeAnim, setLikeAnim] = useState(false);
  const [dislikeAnim, setDislikeAnim] = useState(false);

  const handleLike = () => {
    if (myInteraction === 'like') return;
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 600);
    onInteract(post.id, 'like');
  };

  const handleDislike = () => {
    if (myInteraction === 'dislike') return;
    setDislikeAnim(true);
    setTimeout(() => setDislikeAnim(false), 600);
    onInteract(post.id, 'dislike');
  };

  return (
    <div
      className="feed-card p-4 animate-slide-up"
      style={{ animationDelay: `${idx * 80}ms` }}
    >
      {/* Author row */}
      <div className="flex items-start gap-3 mb-3">
        <button
          onClick={() => navigate(`/profile/${post.author_id}`)}
          className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center text-xl flex-shrink-0 overflow-hidden"
        >
          {post.author?.avatar_url ? (
            <img src={post.author.avatar_url} className="w-full h-full object-cover" />
          ) : "👤"}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-semibold text-sm">
              {post.author?.full_name || "Anonymous Student"}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${post.tag_color}`}>{post.tag}</span>
          </div>
          <p className="text-muted-foreground text-[10px]">{post.time} • {userCollege}</p>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed mb-4">{post.content}</p>

      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className={`grid gap-2 mb-4 overflow-hidden rounded-2xl ${post.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.media_urls.map((url) => (
            <img key={url} src={url} className={`w-full object-cover aspect-square ${post.media_urls.length === 1 ? 'max-h-80 aspect-auto' : ''}`} />
          ))}
        </div>
      )}

      {/* Poll */}
      {post.poll_data && (
        <div className="glass-card border border-primary/10 rounded-2xl p-4 mb-4">
          <p className="text-[10px] items-center gap-1 font-bold text-primary uppercase tracking-widest mb-3 flex">
            <TrendingUp size={12} /> Live Poll
          </p>
          <div className="space-y-2">
            {post.poll_data.options.map((opt: string) => {
              const votes = post.poll_data.votes?.[opt] || 0;
              const total = Object.values(post.poll_data.votes || {}).reduce((a: any, b: any) => a + b, 0) as number;
              const perc = total > 0 ? (votes / total) * 100 : 0;
              return (
                <button key={opt} className="w-full h-10 relative rounded-xl overflow-hidden bg-muted group active:scale-[0.98] transition-all">
                  <div className="absolute inset-0 bg-primary/20 transition-all" style={{ width: `${perc}%` }} />
                  <div className="relative px-4 flex items-center justify-between text-xs h-full">
                    <span className="font-semibold">{opt}</span>
                    <span className="text-muted-foreground">{Math.round(perc)}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactions */}
      <div className="flex items-center gap-3">
        {/* Like */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-all relative overflow-hidden select-none ${
            myInteraction === 'like'
              ? 'bg-orange-500/20 text-orange-400'
              : 'bg-muted/30 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Flame
            size={16}
            fill={myInteraction === 'like' ? 'currentColor' : 'none'}
            className={`transition-all ${likeAnim ? 'animate-heartbeat scale-150 text-orange-400' : ''}`}
          />
          <span className="text-[11px] font-bold">{post.likes_count || 0}</span>
          {likeAnim && (
            <span className="absolute inset-0 rounded-2xl bg-orange-400/20 animate-ping" />
          )}
        </button>

        {/* Dislike */}
        <button
          onClick={handleDislike}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-all relative overflow-hidden select-none ${
            myInteraction === 'dislike'
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-muted/30 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Snowflake
            size={16}
            fill={myInteraction === 'dislike' ? 'currentColor' : 'none'}
            className={`transition-all ${dislikeAnim ? 'animate-heartbeat scale-150 text-blue-400' : ''}`}
          />
          <span className="text-[11px] font-bold">{post.dislikes_count || 0}</span>
          {dislikeAnim && (
            <span className="absolute inset-0 rounded-2xl bg-blue-400/20 animate-ping" />
          )}
        </button>

        {/* Comment */}
        <button
          onClick={() => onOpenComments(post.id)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-muted/30 text-muted-foreground hover:bg-muted transition-all ml-auto"
        >
          <MessageCircle size={15} />
          <span className="text-[11px] font-bold">{post.comments_count || 0}</span>
        </button>
      </div>
    </div>
  );
}

export default function Feed() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCollege, setUserCollege] = useState("Loading...");
  const [activeTag, setActiveTag] = useState("✨ Trending");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userInteractions, setUserInteractions] = useState<Record<string, 'like' | 'dislike'>>({});
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const { unreadCount } = useNotifications();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setUserProfile(profile);
      fetchUserCollege(user.id, profile);
      fetchUserInteractions(user.id);
    }
    fetchPosts();
  };

  const fetchUserInteractions = async (uid: string) => {
    const { data } = await supabase
      .from("post_interactions")
      .select("post_id, type")
      .eq("user_id", uid);
    if (data) {
      const map: Record<string, 'like' | 'dislike'> = {};
      data.forEach(i => { map[i.post_id] = i.type; });
      setUserInteractions(map);
    }
  };

  const fetchUserCollege = async (uid: string, profile: any) => {
    try {
      if (profile?.mode === 'global') {
        setUserCollege("Global Feed");
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('mode, college:colleges(name)')
        .eq('id', uid)
        .single();
      if (data) {
        const collegeObj = (data as any).college;
        setUserCollege(data.mode === 'global' ? "Global Feed" : (collegeObj?.name || "Campus Feed"));
      }
    } catch {
      setUserCollege("Campus Feed");
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`*, author:profiles!author_id(full_name, avatar_url, username)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setPosts(data.map(p => ({
          ...p,
          time: getRelativeTime(p.created_at),
          tag_color: p.tag_color || "bg-primary/15 text-primary",
          tag: p.tag || "General",
        })));
      }
    } catch (error: any) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInteraction = async (postId: string, type: 'like' | 'dislike') => {
    if (!userId) {
      toast({ title: "Auth required", description: "Please login to interact." });
      return;
    }

    // Optimistic update
    const prev = userInteractions[postId];
    setUserInteractions(old => ({ ...old, [postId]: type }));
    setPosts(posts => posts.map(p => {
      if (p.id !== postId) return p;
      let likes = p.likes_count || 0;
      let dislikes = p.dislikes_count || 0;
      if (prev === 'like') likes = Math.max(0, likes - 1);
      if (prev === 'dislike') dislikes = Math.max(0, dislikes - 1);
      if (type === 'like') likes++;
      if (type === 'dislike') dislikes++;
      return { ...p, likes_count: likes, dislikes_count: dislikes };
    }));

    try {
      await supabase
        .from('post_interactions')
        .upsert({ post_id: postId, user_id: userId, type }, { onConflict: 'post_id,user_id' });
    } catch (error: any) {
      toast({ title: "Interaction failed", description: error.message, variant: "destructive" });
    }
  };

  const filteredPosts = posts.filter(post => {
    if (activeTag === "✨ Trending") return true;
    return post.tag === activeTag.split(' ').slice(1).join(' ');
  });

  return (
    <>
      <AppLayout onRefresh={fetchPosts}>
        <div className="px-4  relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="font-display font-bold text-2xl">
                {userCollege === "Global Feed" ? "Global Feed" : "Campus Feed"}
              </h1>
              <p className="text-muted-foreground text-xs">{userCollege} • {loading ? "..." : posts.length} posts</p>
            </div>
            <div className="flex gap-2 items-center">
              <button 
                onClick={() => navigate("/notifications")}
                className="w-10 h-10 rounded-2xl glass-card border border-border flex items-center justify-center relative transition-transform active:scale-90"
              >
                <Bell size={18} className="text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center px-1 animate-in zoom-in-50 duration-300">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button onClick={() => navigate("/profile")} className="group relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-brand p-[2px] transition-transform active:scale-95 group-hover:scale-105">
                  <div className="w-full h-full rounded-[14px] bg-background flex items-center justify-center overflow-hidden">
                    {userProfile?.avatar_url ? (
                      <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-background flex items-center justify-center border border-border">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                </div>
              </button>
            </div>
          </div>

          {/* Floating Action Button */}
          <button
            onClick={() => navigate("/create")}
            className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom,24px))] right-6 w-14 h-14 rounded-2xl bg-gradient-brand shadow-glow flex items-center justify-center text-white z-50 animate-in zoom-in-50 duration-300"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>

          {/* Tag bar */}
          <div className="flex gap-2 mb-5 overflow-x-auto scroll-hidden pb-1">
            {["✨ Trending", "🔥 Hot", "🎓 Placements", "💌 Confessions", "📚 Study", "🎉 Events"].map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`pill-tag whitespace-nowrap flex-shrink-0 transition-all ${activeTag === tag ? "active scale-105" : "opacity-60"}`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Feed */}
          <div className="space-y-4 pb-6">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-muted-foreground" />
              </div>
            ) : (
              filteredPosts.map((post, idx) => (
                <PostCard
                  key={post.id}
                  post={post}
                  userCollege={userCollege}
                  userId={userId}
                  userInteractions={userInteractions}
                  onInteract={handleInteraction}
                  onOpenComments={(id) => setCommentPostId(id)}
                  navigate={navigate}
                  idx={idx}
                />
              ))
            )}
          </div>
        </div>
      </AppLayout>

      {/* Comment Sheet - Outside AppLayout to avoid clipping and Fix Visibility */}
      <CommentSheet
        postId={commentPostId || ""}
        open={!!commentPostId}
        onClose={() => setCommentPostId(null)}
      />
    </>
  );
}
