import { useState } from "react";
import { Bell, Search, TrendingUp } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";

const FEED_POSTS = [
  {
    id: 1,
    nickname: "StarlightK",
    avatar: "⭐",
    time: "2m ago",
    content: "The library 3rd floor has the best vibes for studying at night. Anyone else basically live there during exams? 😂",
    reactions: { "💜": 24, "😂": 12, "🔥": 8 },
    comments: 7,
    tag: "Campus Life",
    tagColor: "bg-primary/15 text-primary",
  },
  {
    id: 2,
    nickname: "ChaiAddict99",
    avatar: "☕",
    time: "15m ago",
    content: "Hot take: the canteen's maggi at 11pm hits different than any restaurant. Change my mind.",
    reactions: { "💜": 45, "🍜": 31, "✨": 9 },
    comments: 23,
    tag: "Food",
    tagColor: "bg-match/15 text-match",
  },
  {
    id: 3,
    nickname: "MidnightCoder",
    avatar: "💻",
    time: "1h ago",
    content: "Placement szn is absolutely unhinged. Who else is surviving purely on caffeine and denial? 💀",
    reactions: { "💀": 67, "😭": 43, "💜": 28 },
    comments: 34,
    tag: "Placements",
    tagColor: "bg-crush/15 text-crush",
  },
  {
    id: 4,
    nickname: "AnonymousBee",
    avatar: "🐝",
    time: "3h ago",
    content: "Saw someone reading 'Atomic Habits' at the campus café. If that's you... hi 👋 you seemed really focused and it was adorable.",
    reactions: { "💜": 89, "🥺": 54, "✨": 22 },
    comments: 41,
    tag: "Anonymous",
    tagColor: "bg-accent/15 text-accent",
  },
];

export default function Feed() {
  const navigate = useNavigate();
  const [reacted, setReacted] = useState<Record<string, string>>({});
  const [showCompose, setShowCompose] = useState(false);
  const [newPost, setNewPost] = useState("");

  const handleReact = (postId: number, emoji: string) => {
    setReacted(prev => ({ ...prev, [postId]: prev[postId] === emoji ? "" : emoji }));
  };

  return (
    <AppLayout>
      <div className="px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display font-bold text-2xl">Campus Feed</h1>
            <p className="text-muted-foreground text-xs">MIT Manipal • 847 active</p>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-2xl glass-card border border-border flex items-center justify-center relative">
              <Bell size={18} className="text-foreground" />
              <span className="notif-dot absolute top-1 right-1" />
            </button>
            <button className="w-10 h-10 rounded-2xl glass-card border border-border flex items-center justify-center">
              <Search size={18} className="text-foreground" />
            </button>
          </div>
        </div>

        {/* Trending bar */}
        <div className="flex gap-2 mb-5 overflow-x-auto scroll-hidden pb-1">
          {["✨ Trending", "🔥 Hot", "🎓 Placements", "💌 Confessions", "📚 Study", "🎉 Events"].map((tag, i) => (
            <button
              key={tag}
              className={`pill-tag whitespace-nowrap flex-shrink-0 ${i === 0 ? "active" : ""}`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Compose */}
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="w-full profile-card p-4 flex items-center gap-3 mb-5 active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center text-lg">
            💜
          </div>
          <span className="text-muted-foreground text-sm flex-1 text-left">Share something anonymously...</span>
          <TrendingUp size={16} className="text-muted-foreground" />
        </button>

        {showCompose && (
          <div className="profile-card p-4 mb-5 animate-slide-up">
            <textarea
              value={newPost}
              onChange={e => setNewPost(e.target.value.slice(0, 280))}
              placeholder="What's on your mind? It's anonymous 👀"
              rows={3}
              className="crushere-input w-full px-4 py-3 rounded-xl text-sm resize-none mb-3"
            />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">{newPost.length}/280</span>
              <button
                onClick={() => { setShowCompose(false); setNewPost(""); }}
                disabled={!newPost.trim()}
                className="btn-brand px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              >
                Post Anonymously
              </button>
            </div>
          </div>
        )}

        {/* Feed */}
        <div className="space-y-4 pb-6">
          {FEED_POSTS.map((post, idx) => (
            <div
              key={post.id}
              className="feed-card p-4 animate-slide-up"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center text-xl flex-shrink-0">
                  {post.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-semibold text-sm">{post.nickname}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${post.tagColor}`}>{post.tag}</span>
                  </div>
                  <p className="text-muted-foreground text-xs">{post.time}</p>
                </div>
              </div>

              <p className="text-sm leading-relaxed mb-3">{post.content}</p>

              {/* Reactions */}
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(post.reactions).map(([emoji, count]) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(post.id, emoji)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                      reacted[post.id] === emoji
                        ? "bg-primary/20 border border-primary/40 text-primary scale-110"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {emoji} {count + (reacted[post.id] === emoji ? 1 : 0)}
                  </button>
                ))}
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-muted text-muted-foreground text-xs font-medium ml-auto">
                  💬 {post.comments}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
