import { useState, useEffect, useRef } from "react";
import { X, Heart, CornerDownRight, Send, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  parent_reply_id: string | null;
  mentions: string[] | null;
  author?: { full_name: string; username: string; avatar_url: string };
  replies?: Comment[];
  isLiked?: boolean;
}

interface CommentSheetProps {
  postId: string;
  open: boolean;
  onClose: () => void;
}

export default function CommentSheet({ postId, open, onClose }: CommentSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [posting, setPosting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchCurrentUser();
      fetchComments();
    }
  }, [open, postId]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setCurrentUser(data);
    }
  };

  const fetchComments = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { data } = await supabase
      .from("replies")
      .select("*, author:profiles!author_id(full_name, username, avatar_url)")
      .eq("post_id", postId)
      .is("parent_reply_id", null)
      .order("created_at", { ascending: true });

    if (!data) { setLoading(false); return; }

    // Fetch liked comment IDs for current user
    if (user) {
      const { data: liked } = await supabase
        .from("comment_likes")
        .select("reply_id")
        .eq("user_id", user.id);
      setLikedIds(new Set(liked?.map(l => l.reply_id) || []));
    }

    // Fetch nested replies for each top-level comment
    const enriched = await Promise.all(data.map(async (c) => {
      const { data: nested } = await supabase
        .from("replies")
        .select("*, author:profiles!author_id(full_name, username, avatar_url)")
        .eq("parent_reply_id", c.id)
        .order("created_at", { ascending: true });
      return { ...c, replies: nested || [] };
    }));

    setComments(enriched);
    setLoading(false);
  };

  const handlePost = async () => {
    if (!text.trim() || !currentUser) return;
    setPosting(true);
    try {
      // Extract @mentions from text
      const mentions = (text.match(/@(\w+)/g) || []).map(m => m.slice(1));

      const { error } = await supabase.from("replies").insert({
        post_id: postId,
        author_id: currentUser.id,
        content: text.trim(),
        parent_reply_id: replyTo?.id || null,
        mentions: mentions.length ? mentions : null,
      });

      if (error) throw error;

      setText("");
      setReplyTo(null);
      fetchComments();
    } catch (error: any) {
      toast({ title: "Failed to post", description: error.message, variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const handleLikeComment = async (commentId: string, currentLikes: number) => {
    if (!currentUser) return;
    const isLiked = likedIds.has(commentId);

    // Optimistic update
    setLikedIds(prev => {
      const next = new Set(prev);
      if (isLiked) next.delete(commentId); else next.add(commentId);
      return next;
    });
    setComments(prev => prev.map(c => {
      if (c.id === commentId) return { ...c, likes_count: c.likes_count + (isLiked ? -1 : 1) };
      if (c.replies) {
        return { ...c, replies: c.replies.map(r => r.id === commentId ? { ...r, likes_count: r.likes_count + (isLiked ? -1 : 1) } : r) };
      }
      return c;
    }));

    if (isLiked) {
      await supabase.from("comment_likes").delete().eq("reply_id", commentId).eq("user_id", currentUser.id);
      await supabase.from("replies").update({ likes_count: Math.max(0, currentLikes - 1) }).eq("id", commentId);
    } else {
      await supabase.from("comment_likes").insert({ reply_id: commentId, user_id: currentUser.id });
      await supabase.from("replies").update({ likes_count: currentLikes + 1 }).eq("id", commentId);
    }
  };

  const handleTextChange = async (val: string) => {
    setText(val);
    // Detect @mention
    const atMatch = val.match(/@(\w*)$/);
    if (atMatch && atMatch[1].length >= 1) {
      setMentionQuery(atMatch[1]);
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .ilike("username", `${atMatch[1]}%`)
        .limit(5);
      setMentionSuggestions(data || []);
    } else {
      setMentionQuery("");
      setMentionSuggestions([]);
    }
  };

  const insertMention = (username: string) => {
    const newText = text.replace(/@\w*$/, `@${username} `);
    setText(newText);
    setMentionSuggestions([]);
    inputRef.current?.focus();
  };

  const renderComment = (comment: Comment, isNested = false) => (
    <div key={comment.id} className={`${isNested ? "ml-10 mt-2" : "mt-4"}`}>
      <div className="flex items-start gap-2.5">
        <Avatar className="w-8 h-8 flex-shrink-0 border border-white/10">
          <AvatarImage src={comment.author?.avatar_url} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {comment.author?.full_name?.[0] || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="bg-white/5 rounded-2xl rounded-tl-sm px-3 py-2.5">
            <p className="text-xs font-bold text-foreground/90 mb-0.5">
              {comment.author?.full_name || "Anonymous"}
              <span className="font-normal text-muted-foreground ml-1.5 text-[10px]">@{comment.author?.username}</span>
            </p>
            <p className="text-sm text-foreground/85 leading-relaxed">
              {comment.content.split(/(@\w+)/g).map((part, i) =>
                part.startsWith("@") ? (
                  <span key={i} className="text-primary font-semibold">{part}</span>
                ) : part
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1.5 px-1">
            <span className="text-[10px] text-muted-foreground/50">
              {format(new Date(comment.created_at), "MMM d, HH:mm")}
            </span>
            <button
              onClick={() => { setReplyTo(comment); inputRef.current?.focus(); }}
              className="text-[10px] text-muted-foreground/60 font-semibold hover:text-primary transition-colors"
            >
              Reply
            </button>
            <button
              onClick={() => handleLikeComment(comment.id, comment.likes_count)}
              className={`flex items-center gap-1 text-[10px] font-semibold transition-all ${
                likedIds.has(comment.id) ? "text-red-500 scale-110" : "text-muted-foreground/60 hover:text-red-400"
              }`}
            >
              <Heart size={11} fill={likedIds.has(comment.id) ? "currentColor" : "none"} className="transition-all" />
              {comment.likes_count > 0 && comment.likes_count}
            </button>
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-10 mt-1 border-l border-white/10 pl-3">
          {comment.replies.map(r => renderComment(r, true))}
        </div>
      )}
    </div>
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-background border-t border-white/10 rounded-t-[32px] flex flex-col animate-in slide-in-from-bottom-full duration-300 max-h-[85vh] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        {/* Handle */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="w-8 h-1 bg-white/20 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
          <h3 className="font-display font-bold text-base">Comments</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 pb-2 scroll-hidden">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground/50 text-sm">
              <p className="text-2xl mb-2">💬</p>
              <p>No comments yet. Be the first!</p>
            </div>
          ) : (
            comments.map(c => renderComment(c))
          )}
        </div>

        {/* Reply indicator */}
        {replyTo && (
          <div className="mx-4 mb-1 px-3 py-1.5 bg-primary/10 rounded-xl flex items-center gap-2 text-xs text-primary">
            <CornerDownRight size={12} />
            <span>Replying to <strong>@{replyTo.author?.username}</strong></span>
            <button onClick={() => setReplyTo(null)} className="ml-auto"><X size={12} /></button>
          </div>
        )}

        {/* @mention suggestions */}
        {mentionSuggestions.length > 0 && (
          <div className="mx-4 mb-1 bg-card border border-white/10 rounded-2xl overflow-hidden">
            {mentionSuggestions.map(u => (
              <button
                key={u.id}
                onClick={() => insertMention(u.username)}
                className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-white/5 text-left"
              >
                <Avatar className="w-7 h-7">
                  <AvatarImage src={u.avatar_url} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{u.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-semibold">{u.full_name}</p>
                  <p className="text-[10px] text-muted-foreground">@{u.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-4 border-t border-white/10 bg-background/95 backdrop-blur-md flex items-end gap-3 pb-safe-offset-2">
          <Avatar className="w-10 h-10 flex-shrink-0 border border-white/10 shadow-sm">
            <AvatarImage src={currentUser?.avatar_url} />
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">{currentUser?.full_name?.[0] || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 bg-white/5 border border-white/10 rounded-[22px] px-4 py-2.5 flex items-end gap-3 transition-all focus-within:border-primary/50 focus-within:bg-white/10">
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => handleTextChange(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none max-h-32 min-h-[22px] py-1"
              rows={1}
            />
            <button
              onClick={handlePost}
              disabled={!text.trim() || posting}
              className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0 disabled:opacity-40 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              {posting ? <Loader2 size={16} className="animate-spin text-white" /> : <Send size={16} className="text-white" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
